import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';

export const TransformDate = ({ isNullable = false } = {}) => {
  return Transform(({ value }) => {
    if (isNullable && (value === null || value === '')) {
      return null;
    }
    try {
      return new Date(value).toISOString();
    } catch {
      throw new BadRequestException('Invalid date');
    }
  });
};

export const TransformUppercase = () => {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  );
};

export const TransformEnum = (enumObj) => {
  return Transform(
    ({ value }) =>
      (value = isNaN(parseInt(value))
        ? enumObj[value]
        : enumObj[enumObj[value]]),
  );
};
export const TransformStringify = () => {
  return Transform(({ value }) => JSON.stringify(value));
};

export const TransformParse = () => {
  return Transform(({ value }) => JSON.parse(value));
};

export const TransformToNumber = (fieldName: string = 'field') => {
  return Transform((value) => {
    const numberValue = Number(value.value);

    if (Number.isNaN(numberValue)) {
      throw new BadRequestException(`${fieldName} Must be number`);
    }

    return numberValue;
  });
};
export const TransformToBoolean = () => {
  return Transform(({ value }) => {
    if (value === 'true' || value === '1' || value === 1 || value === true) {
      return true;
    }
    if (
      value === 'false' ||
      value === '0' ||
      value === 0 ||
      value === false ||
      value === ''
    ) {
      return false;
    }
    return value;
  });
};
