import dotenv from 'dotenv';
dotenv.config();
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

// Express.MulterS3.File

const profilePhotoBucket = process.env.PROFILE_PHOTO_S3_BUCKET;
const bannerPhotoBucket = process.env.BANNER_PHOTO_S3_BUCKET;
const packPhotoBucket = process.env.PACK_PHOTO_S3_BUCKET;

const buckets = {
	profilePhotoBucket,
	bannerPhotoBucket,
	packPhotoBucket,
};

const photoResizing: { [K in BucketName]?: { width?: number; height?: number } } = {
	profilePhotoBucket: { width: 800 },
	bannerPhotoBucket: { width: 2000 },
	packPhotoBucket: { width: 1200 },
};

interface PositionData {
	x: number;
	y: number;
	scale: number;
	cropWidth: number;
	cropHeight: number;
}

type BucketName = 'profilePhotoBucket' | 'bannerPhotoBucket' | 'packPhotoBucket';

const bucketRegion = process.env.AWS_REGION;
const accessKey = process.env.PP_S3_ACCESS_KEY;
const secretAccessKey = process.env.PP_S3_SECRET_ACCESS_KEY;
const photoUploadCloudfrontUrl = process.env.CLOUDFRONT_PHOTO_UPLOAD_URL ?? '';

const s3 = new S3Client({
	credentials: {
		accessKeyId: accessKey ?? '',
		secretAccessKey: secretAccessKey ?? '',
	},
	region: bucketRegion,
});

export const s3UploadPhoto = (bucketName: BucketName) =>
	multer({
		limits: { fileSize: 52428800 }, // 50 mb limit
		fileFilter(_req, file, cb) {
			const { mimetype: type } = file;
			if (type === 'image/jpeg' || type === 'image/png') return cb(null, true);
			cb(null, false);
		},
		storage: multerS3({
			s3: s3,
			bucket: buckets[bucketName] ?? '',
			metadata: function (_req, file, cb) {
				cb(null, { fieldName: file.fieldname });
			},
			key(_req, file, cb) {
				cb(null, `${Date.now().toString()}-${file.originalname}`);
			},
		}),
	});

export const s3DeletePhoto = async (photoUrl: string) => {
	try {
		const object = photoUrl.replace(`${photoUploadCloudfrontUrl}/`, '');
		const { bucket, key } = JSON.parse(atob(object));

		const photoParams = {
			Bucket: bucket,
			Key: key,
		};

		const deleteCommand = new DeleteObjectCommand(photoParams);
		return await s3.send(deleteCommand);
	} catch (err) {
		return err;
	}
};

interface CloudFrontEdits {
	extract?: {
		left: number;
		top: number;
		width: number;
		height: number;
	};
	resize?: {
		width?: number;
		height?: number;
		fit?: string;
		position?: string;
	};
}

export const createCloudfrontUrlForPhoto = (
	key: string | undefined,
	bucketName: BucketName,
	positionData?: PositionData,
) => {
	const targetResize = photoResizing[bucketName];
	let edits: CloudFrontEdits = {};

	if (positionData) {
		// Apply crop first, then resize to target dimensions
		edits = {
			extract: {
				left: Math.max(0, Math.floor(positionData.x)),
				top: Math.max(0, Math.floor(positionData.y)),
				width: Math.floor(positionData.cropWidth),
				height: Math.floor(positionData.cropHeight),
			},
			resize: { ...targetResize },
		};
	} else {
		// Default: use center crop with cover fit to preserve aspect ratio
		edits = {
			resize: {
				...targetResize,
				fit: 'cover',
				position: 'center',
			},
		};
	}

	const imageRequest = JSON.stringify({
		bucket: buckets[bucketName],
		key: key,
		edits,
	});
	const encodedObject = btoa(imageRequest);
	return `${photoUploadCloudfrontUrl}/${encodedObject}`;
};
