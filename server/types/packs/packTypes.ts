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
	userId: string;
	packId: number;
	packIndex: string;
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
