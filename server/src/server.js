import app from "./app.js";

const PORT = process.env.PORT || 4007;
app.listen(PORT, () => console.log(`nsp-club server listening on :${PORT}`));
