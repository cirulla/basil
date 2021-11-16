import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from './transactions.module';
import { OrdersModule } from '../orders/orders.module';
import { User } from '../users/entities/user.entity';
import { EntityManager } from 'typeorm';
import { hash } from 'bcrypt';

describe('TransactionsService', () => {
  let service: TransactionsService;
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
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('checkTransaction', () => {
    it('should fail when the related user is missing', () => {
      expect(
        service.checkTransaction({
          user: { id: 1 } as User,
          amount: 10,
        }),
      ).rejects.toThrowError(NotFoundException);
    });

    it('should fail when user balance is insufficient to satisfy the amount', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
      });
      await expect(
        service.checkTransaction({
          user,
          amount: -10,
        }),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should update the user balance', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
      });
      await service.checkTransaction({
        user,
        amount: 10,
      });
      const updatedUser = await entityManager.findOne(User, user.id);
      expect(updatedUser.balance).toEqual(10);
    });
  });

  afterEach(() => {
    return module.close();
  });
});
