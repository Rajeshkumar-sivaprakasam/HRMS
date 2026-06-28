import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../../core/db';
import { User } from '../../models';

export class AuthRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ['employee', 'employee.workLocation'],
    });
  }

  async getById(userId: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  async getByActivationToken(token: string): Promise<User | null> {
    return this.repo.findOne({
      where: { activationToken: token, deletedAt: IsNull() },
    });
  }

  async getByResetToken(token: string): Promise<User | null> {
    return this.repo.findOne({
      where: { passwordResetToken: token, deletedAt: IsNull() },
    });
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }
}
