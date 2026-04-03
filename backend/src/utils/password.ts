import * as bcrypt from 'bcryptjs';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    try {
      // const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  static async compare(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Error comparing passwords');
    }
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // if (!/(?=.*[a-z])/.test(password)) {
    //   errors.push('Password must contain at least one lowercase letter');
    // }

    // if (!/(?=.*[A-Z])/.test(password)) {
    //   errors.push('Password must contain at least one uppercase letter');
    // }{"ip":"::1","level":"error","message":"Error occurred: bcrypt.genSalt is not a function","method":"POST","service":"backend-starter","stack":"TypeError: bcrypt.genSalt is not a function\n    at model.<anonymous> (C:\\Users\\teamb\\Desktop\\Team\\post-pilot\\backend\\src\\models\\User.ts:105:35)\n    at processTicksAndRejections (node:internal/process/task_queues:103:5)","timestamp":"2026-03-24 12:09:58","url":"/api/auth/register","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"}


    // if (!/(?=.*\d)/.test(password)) {
    //   errors.push('Password must contain at least one number');
    // }

    // if (!/(?=.*[@$!%*?&])/.test(password)) {
    //   errors.push('Password must contain at least one special character');
    // }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
