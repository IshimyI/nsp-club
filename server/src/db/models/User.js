import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "users",
    timestamps: true,
    updatedAt: false,
  }
);

export default User;
