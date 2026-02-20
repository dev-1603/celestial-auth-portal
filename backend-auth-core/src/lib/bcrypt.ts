// src/lib/bcrypt.ts
import bcrypt from 'bcryptjs'
import { authConfig } from '../config/auth.config'

const SALT_ROUNDS = authConfig.bcrypt.rounds

export const hashPassword = async (plain: string): Promise<string> =>
    bcrypt.hash(plain, SALT_ROUNDS)

export const comparePassword = async (
    plain: string,
    hash: string,
): Promise<boolean> => bcrypt.compare(plain, hash)
