import { PackItem } from '../../types/packs/packTypes.js';

export const mockUser = {
	first_name: 'Ryan',
	last_name: 'Brockhoff',
	email: 'ryan@tidytrek.co',
	password: 'ilovehiking',
	username: 'tidyTrekHiker171',
	trailName: 'Rocket',
};

export const mockPack = {
	pack_name: 'Kungsleden',
	pack_description:
		'This is the pack used for my thruhike in the Arctic Circle of Sweden!',
	pack_public: true,
	pack_location_tag: 'Sweden',
	pack_season_tag: 'Summer',
	pack_duration_tag: '1 Month',
	pack_distance_tag: '300 Miles',
	pack_index: 0,
};

export const mockPack2 = {
	pack_name: 'Utah Pack',
	pack_description: 'This is the pack used for backpacking in Utah in the winter.',
	pack_public: false,
	pack_location_tag: 'Utah',
	pack_season_tag: 'Winter',
	pack_duration_tag: '1-3 Nights',
	pack_distance_tag: '50 Miles',
	pack_index: 1,
};

export const mockPackCategory = {
	pack_category_name: 'Big 3',
	pack_category_index: 0,
};

export const mockPackItems: PackItem[] = [
	{
		pack_item_name: 'Durston Kakwa',
		pack_item_description: '40 Liter UL Pack',
		pack_item_weight: 28,
		pack_item_unit: 'oz',
		pack_item_quantity: 1,
		pack_item_index: 0,
	},
	{
		pack_item_name: 'X-Mid 2',
		pack_item_description: '2-person regular version',
		pack_item_weight: 40,
		pack_item_unit: 'oz',
		pack_item_quantity: 1,
		pack_item_index: 1,
	},
	{
		pack_item_name: 'Nemo Tensor Insulated',
		pack_item_description: 'Sleeping Pad',
		pack_item_weight: 1,
		pack_item_unit: 'lb',
		pack_item_quantity: 1,
		pack_item_index: 2,
	},
];

export const notSeededPackItem = {
	pack_item_name: 'Petz Headlamp',
	pack_item_description: 'Rechargeable',
	pack_item_weight: 3,
	pack_item_unit: 'oz',
	pack_item_quantity: 1,
};
export const notSeededUser = {
	first_name: 'Sarah',
	last_name: 'Collins',
	email: 'scollins@tidytrek.co',
	password: 'newtohiking123!',
};

export const mockGearClosetItems: PackItem[] = [
	{
		pack_item_name: 'REI Flash',
		pack_item_description: 'Old 55 liter pack',
		pack_item_weight: 36,
		pack_item_unit: 'oz',
		pack_item_quantity: 1,
		pack_item_index: 0,
	},
	{
		pack_item_name: 'Big Agnes Copper Spur',
		pack_item_description: '1-person tent',
		pack_item_weight: 2.5,
		pack_item_unit: 'lb',
		pack_item_quantity: 1,
		pack_item_index: 1,
	},
	{
		pack_item_name: 'Klymit Insulated Pad',
		pack_item_description: 'Sleeping Pad',
		pack_item_weight: 18,
		pack_item_unit: 'oz',
		pack_item_quantity: 1,
		pack_item_index: 2,
	},
];
