export type PackItem = {
	pack_item_name: string;
	pack_item_description: string;
	user_id?: number;
	pack_id?: number;
	pack_category_id?: number;
	pack_item_weight: number;
	pack_item_unit: string;
	pack_item_quantity: number;
	pack_item_index: number;
};

export type Pack = {
	userId: number;
	packId: number;
	packIndex: number;
	packName: string;
	packDescription: string;
	packLocationTag: string;
	packDurationTag: string;
	packSeasonTag: string;
	packDistanceTag: string;
	packPublic: boolean;
	packAffiliate: boolean;
	packAffiliateDescription: string;
	packUrlName: string;
	packUrl: string;
	packViews: number;
	createdAt: string;
	updatedAt: string;
};
