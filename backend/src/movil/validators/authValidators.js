import { body, validationResult } from 'express-validator';

/**
 * Middleware que recopila errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: extractedErrors
    });
  }

  next();
};

/**
 * 🧾 Validaciones para el registro
 */
export const registerValidation = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('correo_usuario')
    .trim()
    .notEmpty()
    .withMessage('El correo es obligatorio')
    .isEmail()
    .withMessage('Debe proporcionar un correo válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El correo no puede exceder 100 caracteres'),

  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  body('confirmarContrasena')
    .notEmpty()
    .withMessage('Debe confirmar su contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.contrasena) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * 🔐 Validaciones para el login
 */
export const loginValidation = [
  body('correo_usuario')
    .trim()
    .notEmpty()
    .withMessage('El correo es obligatorio')
    .isEmail()
    .withMessage('Debe proporcionar un correo válido')
    .normalizeEmail(),

  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),

  handleValidationErrors
];