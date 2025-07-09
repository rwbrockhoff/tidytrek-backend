export type PackItem = {
	pack_item_id: number;
	user_id: string;
	pack_id?: number | null;
	pack_category_id?: number | null;
	pack_item_index?: string;
	pack_item_name: string;
	pack_item_description?: string | null;
	pack_item_quantity?: number;
	pack_item_weight?: number | null;
	pack_item_unit?: string;
	pack_item_price?: number | null;
	pack_item_url?: string | null;
	worn_weight?: boolean;
	consumable?: boolean;
	favorite?: boolean;
	created_at?: string;
	updated_at?: string | null;
};

export type PackCategory = {
	pack_category_id: number;
	user_id: string;
	pack_id: number;
	pack_category_name?: string;
	pack_category_color?: string | null;
	pack_category_index?: string;
};

export type MockPackItem = Omit<
	PackItem,
	'pack_item_id' | 'pack_id' | 'pack_category_id' | 'created_at' | 'updated_at'
> & {
	pack_id?: number | null;
	pack_category_id?: number | null;
};

export type MockPackCategory = Omit<PackCategory, 'pack_category_id' | 'pack_id'> & {
	pack_id?: number;
};

export type Pack = {
	user_id: string;
	pack_id: number;
	pack_index: string;
	pack_name: string;
	pack_description: string;
	pack_location_tag: string;
	pack_duration_tag: string;
	pack_season_tag: string;
	pack_distance_tag: string;
	pack_public: boolean;
	pack_affiliate: boolean;
	pack_affiliate_description: string;
	pack_url_name: string;
	pack_url: string;
	pack_views: number;
	created_at: string;
	updated_at: string;
};
