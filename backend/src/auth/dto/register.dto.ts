import { IsNotEmpty, IsString, IsIn, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsIn(['ADMIN', 'OPERATIVO'], { message: 'El rol debe ser ADMIN o OPERATIVO' })
  rol: string;
}
