import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../../config/mysqldb';

export interface PurposeAtributes {
    id?: number;
    text: string;
    type: string;
}

export interface PurposeCreationAtributes extends Optional<PurposeAtributes, 'id'> {}

class Purpose extends Model<PurposeAtributes, PurposeCreationAtributes> implements PurposeAtributes {
    public id!: number;
    public text!: string;
    public type!: string;
}

Purpose.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    text: {
        type : DataTypes.STRING(255),
        allowNull: false,
    },
    type: {
        type : DataTypes.STRING(10),
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'purpose',
    timestamps: false,
});

export default Purpose;
