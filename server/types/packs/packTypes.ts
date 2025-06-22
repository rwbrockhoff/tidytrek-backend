export type PackItem = {
	pack_item_name: string;
	pack_item_description: string;
	user_id: string;
	pack_id: number;
	pack_category_id?: number;
	pack_item_weight: number;
	pack_item_unit: string;
	pack_item_quantity: number;
	pack_item_index: string;
};

export type MockPackItem = Omit<PackItem, 'pack_id'> & { pack_id?: string };

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
