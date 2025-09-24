import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const Department = sequelize.define('Department', {
  Deptid: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false }, // Removed autoIncrement
  Deptname: { type: DataTypes.STRING(100), allowNull: false },
  Deptacronym: { type: DataTypes.STRING(10), allowNull: false }
}, { timestamps: false, tableName: 'department' });

export default Department;