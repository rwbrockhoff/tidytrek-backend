export const DEFAULT_INCREMENT = 1000;
export const REBALANCE_THRESHOLD = 12;

function isValidNumber(value: number): boolean {
	return !isNaN(value);
}

export function calculateMidpoint(prevIndex?: string, nextIndex?: string): string {
	if (!prevIndex && !nextIndex) return DEFAULT_INCREMENT.toString();
	if (!prevIndex) return calculateBefore(nextIndex!);
	if (!nextIndex) return calculateAfter(prevIndex!);

	const prev = parseFloat(prevIndex);
	const next = parseFloat(nextIndex);

	if (!isValidNumber(prev) || !isValidNumber(next)) {
		return DEFAULT_INCREMENT.toString();
	}

	const midpoint = (prev + next) / 2;
	return midpoint.toString();
}

function calculateBefore(firstIndex: string): string {
	const first = parseFloat(firstIndex);

	if (!isValidNumber(first)) {
		return DEFAULT_INCREMENT.toString();
	}

	if (first <= 0) return (-DEFAULT_INCREMENT).toString();

	return (first / 2).toString();
}

export function calculateAfter(lastIndex: string): string {
	const last = parseFloat(lastIndex);

	if (!isValidNumber(last)) return DEFAULT_INCREMENT.toString();

	return (last + DEFAULT_INCREMENT).toString();
}

export function generateSequence(
	count: number,
	startValue = DEFAULT_INCREMENT,
	gap = DEFAULT_INCREMENT,
): string[] {
	if (!isValidNumber(count) || count < 0) return [];
	if (!isValidNumber(startValue) || !isValidNumber(gap) || gap <= 0) {
		startValue = DEFAULT_INCREMENT;
		gap = DEFAULT_INCREMENT;
	}

	return Array.from({ length: count }, (_, i) => (startValue + i * gap).toString());
}

export function needsRebalancing(index: string): boolean {
	const decimalPlaces = index.split('.')[1]?.length || 0;
	return decimalPlaces > REBALANCE_THRESHOLD;
}

export function hasInvalidOrdering(prevIndex?: string, nextIndex?: string): boolean {
	if (!prevIndex || !nextIndex) return false;
	
	const prevFloat = parseFloat(prevIndex);
	const nextFloat = parseFloat(nextIndex);
	
	return isValidNumber(prevFloat) && isValidNumber(nextFloat) && prevFloat >= nextFloat;
}