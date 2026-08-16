import crypto from "node:crypto";
import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";
import User from "./User.js";

const Order = sequelize.define(
  "Order",
  {
    // STRING rather than UUID: a handful of orders migrated from the old
    // orders.log file carry a 16-char sha256-derived id (not UUID-shaped),
    // predating this table. New orders still get a real random UUID string.
    id: { type: DataTypes.STRING, defaultValue: () => crypto.randomUUID(), primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    comment: { type: DataTypes.STRING, allowNull: true },
    items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    processed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "orders",
    timestamps: true,
    updatedAt: false,
  }
);

Order.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Order, { foreignKey: "userId", as: "orders" });

export default Order;
