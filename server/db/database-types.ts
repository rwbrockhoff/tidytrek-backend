import { WeightUnit } from '../types/units.js';

// Knex official TS approach - augment the Tables interface
declare module 'knex/types/tables.js' {
	interface Tables {
		user: {
			user_id: string;
			first_name: string;
			last_name: string;
			email: string;
			avatar_url?: string | null;
			supabase_refresh_token?: string | null;
			created_at: Date;
			updated_at: Date;
		};

		pack: {
			pack_id: number;
			user_id: string;
			pack_index: string;
			pack_name: string;
			pack_description?: string | null;
			pack_location_tag?: string | null;
			pack_duration_tag?: string | null;
			pack_season_tag?: string | null;
			pack_distance_tag?: string | null;
			pack_public: boolean;
			pack_affiliate: boolean;
			pack_affiliate_description?: string | null;
			pack_url_name?: string | null;
			pack_url?: string | null;
			pack_views: number;
			pack_photo_url?: string | null;
			pack_photo_s3_key?: string | null;
			pack_photo_position?: { x: number; y: number; zoom: number } | null;
			pack_bookmark_count?: number | null;
			palette?: string | null;
			created_at: Date;
			updated_at: Date;
		};

		pack_category: {
			pack_category_id: number;
			user_id: string;
			pack_id: number;
			pack_category_name?: string | null;
			pack_category_color?: string | null;
			pack_category_index: string;
			created_at: Date;
			updated_at: Date;
		};

		pack_item: {
			pack_item_id: number;
			user_id: string;
			pack_id?: number | null;
			pack_category_id?: number | null;
			pack_item_index?: string | null;
			pack_item_name: string;
			pack_item_description?: string | null;
			pack_item_quantity?: number | null;
			pack_item_weight?: number | null;
			pack_item_weight_unit?: WeightUnit | null;
			pack_item_price?: number | null;
			pack_item_url?: string | null;
			worn_weight: boolean;
			consumable: boolean;
			favorite: boolean;
			created_at: Date;
			updated_at: Date;
		};

		user_settings: {
			user_settings_id: number;
			user_id: string;
			weight_unit: 'metric' | 'imperial';
			public_profile?: boolean | null;
			dark_mode?: boolean | null;
			currency_unit?: string | null;
			palette?: string | null;
			created_at: Date;
			updated_at: Date;
		};

		user_profile: {
			user_profile_id: number;
			user_id: string;
			bio?: string | null;
			location?: string | null;
			website?: string | null;
			username?: string | null;
			trail_name?: string | null;
			profile_photo_url?: string | null;
			profile_photo_s3_key?: string | null;
			profile_photo_position?: { x: number; y: number; zoom: number } | null;
			banner_photo_url?: string | null;
			banner_photo_s3_key?: string | null;
			banner_photo_position?: { x: number; y: number; zoom: number } | null;
			created_at: Date;
			updated_at: Date;
		};

		social_link: {
			social_link_id: number;
			user_id: string;
			platform: string;
			url: string;
			social_link_url: string;
			created_at: Date;
			updated_at: Date;
		};

		pack_bookmarks: {
			pack_bookmark_id: number;
			user_id: string;
			pack_id: number;
			created_at: Date;
			updated_at: Date | null;
		};
	}
}
