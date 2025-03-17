import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../../config/mysqldb';

export interface TimeLineAtributes {
    id: string;
    title: string;
    date: string;
    desc: string;
    category: string;
    color?: string;
}

export interface TimeLineCreationAtributes extends Optional<TimeLineAtributes, 'id'> {}

class TimeLine extends Model<TimeLineAtributes, TimeLineCreationAtributes> implements TimeLineAtributes {
    id!: string;
    title!: string;
    date!: string;
    desc!: string;
    category!: string;
    color!: string;
}

TimeLine.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type : DataTypes.STRING(50),
        allowNull: false,
    },
    date: {
        type : DataTypes.STRING(10),
        allowNull: false
    },
    desc : {
        type : DataTypes.STRING(255),
        allowNull: true
    },
    category : {
        type : DataTypes.STRING(10),
        allowNull: false
    },
    color : {
        type : DataTypes.STRING(50),
        allowNull : true
    }
}, {
    sequelize,
    tableName: 'timeline',
    timestamps: false,
});

export default TimeLine;
