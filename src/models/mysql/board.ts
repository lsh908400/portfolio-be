import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../../config/mysqldb';

export interface BoardAtributes {
    id?: number;
    title: string;
    categoryId: string;
    createAt: string;
    modifyAt: string;
}

export interface BoardCreationAtributes extends Optional<BoardAtributes, 'id'> {}

class Board extends Model<BoardAtributes, BoardCreationAtributes> implements BoardAtributes {
    public id!: number;
    public title!: string;
    public categoryId!: string;
    public createAt!: string;
    public modifyAt!: string;
}

Board.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    categoryId: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    createAt: {
        type : DataTypes.STRING(10),
        allowNull: false,
    },
    modifyAt: {
        type : DataTypes.STRING(10),
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'board',
    timestamps: false,
});

export default Board;

