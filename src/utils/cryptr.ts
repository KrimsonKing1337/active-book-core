// Не удалять.
// Используется как заглушка для будущего шифрования localstorage для ачивок и прочих нечувствительных данных

import Cryptr from 'cryptr';

const secretKey = process.env.ENCRYPT_STORAGE_SECRET_KEY || '';

export const cryptr = new Cryptr(secretKey);
