import { PackItem } from '../../types/packs/pack-types.js';

export type MovablePackItem = Omit<PackItem, 'pack_id' | 'pack_category_id'> & {
	pack_id: number | null;
	pack_category_id: number | null;
};

export type TableName = 'pack_item' | 'pack_category' | 'pack';
export type IndexColumn = 'pack_item_index' | 'pack_category_index' | 'pack_index';
export type WhereConditions = Record<string, string | number | null>;
export type UpdateFields = Record<string, string | number | null>;
export type KnexRecord = Record<string, string | number | null>;

export interface MoveResult {
	newIndex: string;
	rebalanced: boolean;
}