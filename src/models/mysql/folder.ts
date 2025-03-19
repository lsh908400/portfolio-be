import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../../config/mysqldb';

export interface FolderAtributes {
    id?: string;
    pwd: string;
    volume: number;
}

export interface FolderCreationAtributes extends Optional<FolderAtributes, 'id'> {}

class Folder extends Model<FolderAtributes, FolderCreationAtributes> implements FolderAtributes {
    public id!: string;
    public pwd!: string;
    public volume!: number;
}

Folder.init({
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
    },
    pwd: {
        type : DataTypes.STRING(255),
        allowNull: false,
    },
    volume: {
        type : DataTypes.NUMBER,
        allowNull: false
    },
}, {
    sequelize,
    tableName: 'folder',
    timestamps: false,
});

export default Folder;
