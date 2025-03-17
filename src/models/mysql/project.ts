import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../../config/mysqldb';

export interface ProjectAtributes {
    id?: number;
    name: string;
    type: string;
    desc: string;
    img: string;
}

export interface ProjectCreationAtributes extends Optional<ProjectAtributes, 'id'> {}

class Project extends Model<ProjectAtributes, ProjectCreationAtributes> implements ProjectAtributes {
    public id!: number;
    public name!: string;
    public type!: string;
    public desc!: string;
    public img!: string;
}

Project.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type : DataTypes.STRING(50),
        allowNull: false,
    },
    type: {
        type : DataTypes.NUMBER,
        allowNull: false
    },
    desc: {
        type : DataTypes.STRING(50),
        allowNull: false
    },
    img: {
        type : DataTypes.STRING(255),
        allowNull : false
    }
}, {
    sequelize,
    tableName: 'project',
    timestamps: false,
});

export default Project;
