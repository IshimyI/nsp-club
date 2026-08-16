import request from "supertest";
import app from "./app.js";
import sequelize from "./db/sequelize.js";

afterAll(async () => {
  await sequelize.close();
});

describe("GET /api/v1/products", () => {
  it("returns the product list", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("GET /api/v1/rate", () => {
  it("returns a plausible USD/RUB rate", async () => {
    const res = await request(app).get("/api/v1/rate");
    expect(res.status).toBe(200);
    expect(res.body.rub).toBeGreaterThan(30);
    expect(res.body.rub).toBeLessThan(300);
  });
});

describe("GET /product/:slug (server-rendered bot response)", () => {
  it("returns HTML with OG tags for a valid slug", async () => {
    const list = await request(app).get("/api/v1/products");
    const product = list.body[0];
    const res = await request(app).get(`/product/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("og:title");
    expect(res.text).toContain(product.name);
  });

  it("falls through (404) for an unknown slug", async () => {
    const res = await request(app).get("/product/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/products/:slug", () => {
  it("returns a product by slug", async () => {
    const list = await request(app).get("/api/v1/products");
    const slug = list.body[0].slug;
    const res = await request(app).get(`/api/v1/products/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(slug);
  });

  it("404s for an unknown slug", async () => {
    const res = await request(app).get("/api/v1/products/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/order", () => {
  const validPayload = {
    name: "Иван",
    phone: "+7 900 123-45-67",
    comment: "тест",
    items: [{ name: "Тест", article: "1", qty: 1 }],
  };

  it("rejects a missing name", async () => {
    const res = await request(app)
      .post("/api/v1/order")
      .send({ ...validPayload, name: "" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid phone", async () => {
    const res = await request(app)
      .post("/api/v1/order")
      .send({ ...validPayload, phone: "abc" });
    expect(res.status).toBe(400);
  });

  it("rejects empty items", async () => {
    const res = await request(app)
      .post("/api/v1/order")
      .send({ ...validPayload, items: [] });
    expect(res.status).toBe(400);
  });

  it("silently accepts but drops honeypot-tripped submissions", async () => {
    const res = await request(app)
      .post("/api/v1/order")
      .send({ ...validPayload, website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("sent");
  });

  it("accepts a valid order and persists it", async () => {
    const res = await request(app).post("/api/v1/order").send(validPayload);
    expect(res.status).toBe(200);
    expect(["sent", "received_no_notification"]).toContain(res.body.status);
  });
});

describe("customer accounts (register/login/JWT)", () => {
  const phone = `+7900${Date.now().toString().slice(-7)}`;
  const password = "correct-horse-battery";

  it("registers a new account and returns a token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Новый Клиент", phone, password });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.phone).toBe(phone);
  });

  it("rejects a duplicate phone", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Дубликат", phone, password });
    expect(res.status).toBe(409);
  });

  it("rejects a weak password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Слабый Пароль", phone: `+7901${Date.now().toString().slice(-7)}`, password: "123" });
    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ phone, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("rejects a wrong password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ phone, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("rejects /auth/me with no token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user for /auth/me with a valid token", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ phone, password });
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.phone).toBe(phone);
  });

  it("rejects /orders/mine with no token", async () => {
    const res = await request(app).get("/api/v1/orders/mine");
    expect(res.status).toBe(401);
  });

  it("links an order placed with a valid token to that account, visible in /orders/mine", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ phone, password });
    const token = login.body.token;

    await request(app)
      .post("/api/v1/order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Новый Клиент",
        phone,
        items: [{ name: "Товар для истории заказов", article: "42", qty: 3 }],
      });

    const mine = await request(app).get("/api/v1/orders/mine").set("Authorization", `Bearer ${token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.length).toBeGreaterThan(0);
    expect(mine.body[0].items[0].name).toBe("Товар для истории заказов");
  });
});

describe("admin panel (JWT cookie login)", () => {
  const prevUsername = process.env.ADMIN_USERNAME;
  const prevPassword = process.env.ADMIN_PASSWORD;

  beforeAll(() => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "test-secret";
  });

  afterAll(() => {
    process.env.ADMIN_USERNAME = prevUsername;
    process.env.ADMIN_PASSWORD = prevPassword;
  });

  async function loginAsAdmin() {
    const res = await request(app)
      .post("/admin/login")
      .type("form")
      .send({ username: "admin", password: "test-secret" });
    const cookie = res.headers["set-cookie"][0];
    return cookie;
  }

  it("shows the login form", async () => {
    const res = await request(app).get("/admin/login");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Вход в админ-панель");
  });

  it("redirects to login with an error on wrong credentials", async () => {
    const res = await request(app)
      .post("/admin/login")
      .type("form")
      .send({ username: "admin", password: "wrong-password" });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/admin/login?error=1");
  });

  it("sets an admin_token cookie and redirects to /admin on correct credentials", async () => {
    const res = await request(app)
      .post("/admin/login")
      .type("form")
      .send({ username: "admin", password: "test-secret" });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/admin");
    expect(res.headers["set-cookie"][0]).toContain("admin_token=");
    expect(res.headers["set-cookie"][0]).toContain("HttpOnly");
  });

  it("redirects unauthenticated requests to /admin to the login page", async () => {
    const res = await request(app).get("/admin");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/admin/login");
  });

  it("accepts requests with a valid session cookie", async () => {
    const cookie = await loginAsAdmin();
    const res = await request(app).get("/admin").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Заявки на заказ");
  });

  it("lists products missing a price", async () => {
    const cookie = await loginAsAdmin();
    const res = await request(app).get("/admin").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Товары без цены");
  });

  it("filters by search query", async () => {
    const cookie = await loginAsAdmin();
    const res = await request(app).get("/admin?q=zzz-no-such-order-zzz").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Ничего не найдено");
  });

  it("exports CSV behind auth", async () => {
    const unauth = await request(app).get("/admin/export.csv");
    expect(unauth.status).toBe(302);

    const cookie = await loginAsAdmin();
    const res = await request(app).get("/admin/export.csv").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("Дата,Имя,Телефон");
  });

  it("toggles processed state behind auth", async () => {
    const unauth = await request(app).post("/admin/toggle").send({ id: "abc" });
    expect(unauth.status).toBe(302);
    expect(unauth.headers.location).toBe("/admin/login");

    const cookie = await loginAsAdmin();
    const res = await request(app).post("/admin/toggle").set("Cookie", cookie).send({ id: "abc" });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/admin");
  });

  it("logs out by clearing the cookie", async () => {
    const cookie = await loginAsAdmin();
    const res = await request(app).post("/admin/logout").set("Cookie", cookie);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/admin/login");
    expect(res.headers["set-cookie"][0]).toMatch(/admin_token=;/);
  });
});
