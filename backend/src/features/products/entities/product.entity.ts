import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { Category } from '../../categories/entities/category.entity';
import { Role, User } from '../../users/entities/user.entity';

export type ProductId = number;

@Entity()
@Exclude()
export class Product {
  @PrimaryGeneratedColumn()
  @Expose()
  id: ProductId;

  /**
   * If true this product is visible and saleable
   */
  @Column({ default: false })
  @IsNotEmpty()
  @Expose({ groups: Object.values(Role).filter(r => r === Role.CUSTOMER) })
  public: boolean;

  /**
   * A short name
   */
  @Column()
  @IsNotEmpty()
  @Expose()
  name: string;

  /**
   * A detailed description
   */
  @Column()
  @IsNotEmpty()
  @Expose()
  description: string;

  /**
   * Price in €
   */
  @Column()
  @IsNotEmpty()
  @Min(0)
  @Expose()
  price: number;

  /**
   * The number of available units of this product
   * to be sold right now
   */
  @Column({ default: 0 })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Expose()
  available: number;

  /**
   * The number of units currently in customer orders
   */
  @Column({ default: 0 })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Expose({ groups: Object.values(Role).filter(r => r === Role.CUSTOMER) })
  reserved: number;

  /**
   * The number of sold units
   */
  @Column({ default: 0 })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Expose({ groups: Object.values(Role).filter(r => r === Role.CUSTOMER) })
  sold: number;

  /**
   * The category to which this product belongs
   */
  @ManyToOne(() => Category, cat => cat.products)
  category: Category;

  /**
   * The farmer who produces this product
   */
  @ManyToOne(() => User, user => user.products)
  farmer: User;
}
