import { hash } from 'bcrypt';
import { DateTime, Settings } from 'luxon';
import { EntityManager, Not } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mockNotificationsService } from '../../../test/utils';
import { CategoriesModule } from '../categories/categories.module';
import { NotificationsService } from '../notifications/services/notifications.service';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/roles.enum';
import { UsersModule } from '../users/users.module';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsModule } from './products.module';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          dropSchema: true,
          synchronize: true,
        }),
        UsersModule,
        ProductsModule,
        CategoriesModule,
        TransactionsModule,
        OrdersModule,
      ],
    })
      .overrideProvider(NotificationsService)
      .useValue(mockNotificationsService)
      .compile();
    service = module.get<ProductsService>(ProductsService);
  });

  describe('handleUpdateAvailability', () => {
    it('should validate if the concerned fields in the db have 0 value', async () => {
      const entityManager = module.get(EntityManager);
      await service.resetProductsAvailability();
      const products = await entityManager.find(Product, {
        available: Not(0),
        reserved: Not(0),
      });
      expect(products.length > 0).toBe(false);
    });
  });

  describe('reserveProductAmount', () => {
    it('should validate if reserved field of product is changed after the called function', async () => {
      const entityManager = module.get(EntityManager);
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
      });
      await service.reserveProductAmount(product, 8);
      const productUpdated = await entityManager.findOne(Product, {
        id: product.id,
      });
      expect(productUpdated.available).toEqual(2);
      expect(productUpdated.reserved).toEqual(8);
    });
  });

  describe('checkProduct', () => {
    it('should validate a product dto', async () => {
      const dto = {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      } as CreateProductDto;
      const result = await service.validateCreateProductDto(dto, {
        id: 1,
        role: Role.FARMER,
      } as User);
      expect(result).toBeDefined();
    });

    it('should block if the role is farmer and product not contains farmer', async () => {
      const dto = {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      } as CreateProductDto;
      return expect(
        service.validateCreateProductDto(dto, {
          id: 1,
          role: Role.RIDER,
        } as User),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should limit the fields for farmers', async () => {
      const dto = {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
        reserved: 5,
      } as CreateProductDto;
      const result = await service.validateCreateProductDto(dto, {
        id: 1,
        role: Role.FARMER,
      } as User);
      expect(result.reserved).toBeUndefined();
    });
  });

  describe('checkProductsUpdate', () => {
    it('should validate a product update dto', async () => {
      const salesDay = DateTime.now()
        .set({
          weekday: 2,
          hour: 10,
        })
        .toMillis();
      Settings.now = () => salesDay;
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
      });
      expect(
        await service.validateUpdateProductDto(
          product.id,
          {
            ...product,
            available: 5,
          },
          user,
        ),
      ).toMatchObject({ available: 5 });
    });

    it('should fail if the product does not exist', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
      });
      return expect(
        service.validateUpdateProductDto(
          100,
          {
            ...product,
            available: 5,
          },
          user,
        ),
      ).rejects.toThrowError(NotFoundException);
    });

    it('should fail if the role is FARMER but he/she is not the owner of the product', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
        farmer: user,
      });
      return expect(
        service.validateUpdateProductDto(
          product.id,
          {
            ...product,
            available: 5,
          },
          {
            ...user,
            id: 10,
          },
        ),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should limit the fields for farmers', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        farmer: user,
      });
      const updatedProduct = await service.validateUpdateProductDto(
        product.id,
        {
          ...product,
          reserved: 20,
        },
        user,
      );
      expect(updatedProduct.reserved).toBeUndefined();
    });

    it('should modify available field', async () => {
      const salesDay = DateTime.now()
        .set({
          weekday: 3,
          hour: 8,
        })
        .toMillis();
      Settings.now = () => salesDay;

      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 5,
        available: 10,
        farmer: user,
      });
      return expect(
        await service.validateUpdateProductDto(
          product.id,
          {
            ...product,
            available: 5,
          },
          user,
        ),
      ).toMatchObject({ available: 5 });
    });

    it('should modify reserved field', async () => {
      const salesDay = DateTime.now()
        .plus({ weeks: 1 })
        .set({
          weekday: 1,
          hour: 7,
        })
        .toMillis();
      Settings.now = () => salesDay;

      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.MANAGER,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 5,
        farmer: user,
      });
      expect(
        await service.validateUpdateProductDto(
          product.id,
          {
            ...product,
            reserved: 20,
          },
          user,
        ),
      ).toMatchObject({ reserved: 20 });
    });

    it('Should delete and update the entries of the last orders created', async () => {
      const salesDay = DateTime.now()
        .set({
          weekday: 1,
          hour: 6,
        })
        .toMillis();
      Settings.now = () => salesDay;
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user1 = await entityManager.save(User, {
        email: 'test@example.com',
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.CUSTOMER,
      });
      const user2 = await entityManager.save(User, {
        email: 'test@example1.com',
        password: await hash(password, 10),
        name: 'Rose',
        surname: 'Gold',
        role: Role.CUSTOMER,
      });
      const user3 = await entityManager.save(User, {
        email: 'test@example2.com',
        password: await hash(password, 10),
        name: 'Rose',
        surname: 'Gold',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 15,
        reserved: 15,
        farmer: user3,
      });
      const order1 = await entityManager.save(Order, {
        status: OrderStatus.DRAFT,
        user: { id: user1.id },
        entries: [
          {
            product: {
              id: product.id,
            },
            quantity: 10,
          },
        ],
      });
      await new Promise(r => setTimeout(r, 1000));

      const order2 = await entityManager.save(Order, {
        status: OrderStatus.DRAFT,
        user: { id: user2.id },
        entries: [
          {
            product: {
              id: product.id,
            },
            quantity: 2,
          },
        ],
      });
      await service.validateUpdateProductDto(
        product.id,
        {
          reserved: 12,
        } as UpdateProductDto,
        user3 as User,
      );

      const finalOrder1 = await entityManager.findOne(Order, order1.id, {
        relations: ['entries'],
      });
      expect(finalOrder1.entries[0].quantity).toEqual(9);

      const finalOrder2 = await entityManager.findOne(Order, order2.id, {
        relations: ['entries'],
      });
      expect(finalOrder2.entries.length).toEqual(0);
    });
  });

  describe('getAllStockProducts', () => {
    it('should validate if products belong to the farmer specified', async () => {
      const email1 = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user1 = await entityManager.save(User, {
        email: email1,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const email2 = 'test2@example.com';
      const user2 = await entityManager.save(User, {
        email: email2,
        password: await hash(password, 10),
        name: 'Miriam',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const product1 = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
        farmer: user1,
      });
      const product2 = await entityManager.save(Product, {
        name: 'apples',
        description: 'very good apples',
        baseUnit: '1Kg',
        price: 5,
        available: 5,
        farmer: user2,
      });
      expect(
        (await service.getAllStockProducts(user1)).every(
          p => p.farmer.id === user1.id,
        ),
      );
    });

    it('should retrieve all products belong to all farmers', async () => {
      const email1 = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user1 = await entityManager.save(User, {
        email: email1,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const email2 = 'test2@example.com';
      const user2 = await entityManager.save(User, {
        email: email2,
        password: await hash(password, 10),
        name: 'Miriam',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const email3 = 'test3@example.com';
      const user3 = await entityManager.save(User, {
        email: email3,
        password: await hash(password, 10),
        name: 'William',
        surname: 'Doe',
        role: Role.MANAGER,
      });
      const product1 = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
        farmer: user1,
      });
      const product2 = await entityManager.save(Product, {
        name: 'apples',
        description: 'very good apples',
        baseUnit: '1Kg',
        price: 5,
        available: 5,
        farmer: user2,
      });
      expect(await service.getAllStockProducts(user3)).toHaveLength(2);
    });
  });

  describe('getSingleStockProduct', () => {
    it('should validate if a specified product belong to the farmer specified', async () => {
      const email1 = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user1 = await entityManager.save(User, {
        email: email1,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const product1 = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
        farmer: user1,
      });
      expect(
        (await service.getSingleStockProduct(user1, product1.id))?.id,
      ).toEqual(product1.id);
    });

    it('should retrieve a specified product', async () => {
      const email1 = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user1 = await entityManager.save(User, {
        email: email1,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const email2 = 'test2@example.com';
      const user2 = await entityManager.save(User, {
        email: email2,
        password: await hash(password, 10),
        name: 'William',
        surname: 'Doe',
        role: Role.MANAGER,
      });
      const product1 = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
        farmer: user1,
      });
      expect(
        (await service.getSingleStockProduct(user2, product1.id))?.id,
      ).toEqual(product1.id);
    });

    it('should fail if not find a product that belongs to the farmer specified', async () => {
      const email1 = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user1 = await entityManager.save(User, {
        email: email1,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const email2 = 'tes2t@example.com';
      const user2 = await entityManager.save(User, {
        email: email2,
        password: await hash(password, 10),
        name: 'William',
        surname: 'Doe',
        role: Role.FARMER,
      });
      const product1 = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        baseUnit: '1Kg',
        price: 10,
        available: 10,
        farmer: {
          id: user2.id,
        },
      });
      expect(
        service.getSingleStockProduct(user1, product1.id),
      ).rejects.toThrowError(BadRequestException);
    });
  });

  afterEach(() => {
    return module.close();
  });
});
