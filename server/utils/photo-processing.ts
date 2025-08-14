import { createCloudfrontUrlForPhoto } from './s3.js';
import db from '../db/connection.js';
import { validateEnvironment } from '../config/environment.js';

const env = validateEnvironment();

type BucketName = 'profilePhotoBucket' | 'bannerPhotoBucket' | 'packPhotoBucket';

export function createQuickPhotoUrl(key: string, bucketName: BucketName): string {
	const quickProcessingConfig = {
		bucket: getBucketName(bucketName),
		key: key,
		edits: {
			resize: {
				width: 600,
				fit: 'cover',
				position: 'center',
			},
		},
	};
	
	const encodedObject = btoa(JSON.stringify(quickProcessingConfig));
	return `${env.CLOUDFRONT_PHOTO_UPLOAD_URL}/${encodedObject}`;
}

export function createOptimizedPhotoUrl(key: string, bucketName: BucketName): string {
	return createCloudfrontUrlForPhoto(key, bucketName);
}

export async function updateToOptimizedPhoto(
	tableName: string,
	photoUrlColumn: string,
	whereConditions: Record<string, string | number>,
	s3Key: string,
	bucketName: BucketName
) {
	const optimizedUrl = createOptimizedPhotoUrl(s3Key, bucketName);
	
	await db(tableName)
		.update({ [photoUrlColumn]: optimizedUrl })
		.where(whereConditions);
}

function getBucketName(bucketName: BucketName): string {
	const buckets = {
		profilePhotoBucket: env.PROFILE_PHOTO_S3_BUCKET,
		bannerPhotoBucket: env.BANNER_PHOTO_S3_BUCKET,
		packPhotoBucket: env.PACK_PHOTO_S3_BUCKET,
	};
	return buckets[bucketName];
}