import { WeightUnit, WEIGHT_UNIT_VALUES } from '../../types/units.js';

export function validateWeightUnit(
	value: string | number | undefined | null,
): WeightUnit | undefined {
	if (typeof value === 'string' && WEIGHT_UNIT_VALUES.includes(value as WeightUnit)) {
		return value as WeightUnit;
	}
	return undefined;
}

export function validatePrice(value: string | number | undefined | null): number | undefined {
	if (typeof value === 'number') {
		return value;
	}
	if (typeof value === 'string') {
		const parsed = parseFloat(value);
		return isNaN(parsed) ? undefined : parsed;
	}
	return undefined;
}