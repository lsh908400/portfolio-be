import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/mysqldb';

export async function syncCategory() {
    try {
      await Category.sync({ force: false });
    } catch (error) {
      console.error('테이블 동기화 중 오류 발생:', error);
    }
}
  
// 카테고리 인터페이스 정의
export interface CategoryAttributes {
    id?: number;
    title: string;
    icon: string;
}

export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
    public id!: number;
    public title!: string;
    public icon!: string;
}

Category.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    icon: {
        type: DataTypes.STRING(255),
        allowNull: false,
    }
}, {
    sequelize,
    tableName: 'category',
    timestamps: false,
});
  
export default Category;