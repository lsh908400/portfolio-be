import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../../config/mysqldb';

export interface TreeAtributes {
    id?: number;
    depth: number;
    state: string;
    text: string;
    type: string;
}

export interface TreeCreationAtributes extends Optional<TreeAtributes, 'id'> {}

class Tree extends Model<TreeAtributes, TreeCreationAtributes> implements TreeAtributes {
    public id!: number;
    public depth!: number;
    public state!: string;
    public text!: string;
    public type!: string;
}

Tree.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    depth: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    state: {
        type: DataTypes.STRING(10),
        allowNull: false,
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
    tableName: 'tree',
    timestamps: false,
});

export default Tree;
