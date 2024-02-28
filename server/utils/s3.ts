import dotenv from 'dotenv';
dotenv.config();
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const profilePhotoBucket = process.env.PROFILE_PHOTO_S3_BUCKET;
const bannerPhotoBucket = process.env.BANNER_PHOTO_S3_BUCKET;
const packPhotoBucket = process.env.PACK_PHOTO_S3_BUCKET;

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

export const s3UploadProfilePhoto = multer({
	limits: { fileSize: 52428800 }, // 50 mb limit
	fileFilter(_req, file, cb) {
		const { mimetype: type } = file;
		if (type === 'image/jpeg' || type === 'image/png') return cb(null, true);
		cb(null, false);
	},
	storage: multerS3({
		s3: s3,
		bucket: profilePhotoBucket ?? '',
		metadata: function (_req, file, cb) {
			cb(null, { fieldName: file.fieldname });
		},
		key(_req, file, cb) {
			cb(null, `${Date.now().toString()}-${file.originalname}`);
		},
	}),
});

export const s3UploadBannerPhoto = multer({
	limits: { fileSize: 52428800 }, // 50 mb limit
	fileFilter(_req, file, cb) {
		const { mimetype: type } = file;
		if (type === 'image/jpeg' || type === 'image/png') return cb(null, true);
		cb(null, false);
	},
	storage: multerS3({
		s3: s3,
		bucket: bannerPhotoBucket ?? '',
		metadata: function (_req, file, cb) {
			cb(null, { fieldName: file.fieldname });
		},
		key(_req, file, cb) {
			cb(null, `${Date.now().toString()}-${file.originalname}`);
		},
	}),
});

export const s3UploadPackPhoto = multer({
	limits: { fileSize: 52428800 }, // 50 mb limit
	fileFilter(_req, file, cb) {
		const { mimetype: type } = file;
		if (type === 'image/jpeg' || type === 'image/png') return cb(null, true);
		cb(null, false);
	},
	storage: multerS3({
		s3: s3,
		bucket: packPhotoBucket ?? '',
		metadata: function (_req, file, cb) {
			cb(null, { fieldName: file.fieldname });
		},
		key(_req, file, cb) {
			cb(null, `${Date.now().toString()}-${file.originalname}`);
		},
	}),
});

export const deletePhotoFromS3 = async (photoUrl: string) => {
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

export const createProfilePhotoUrlForCloudfront = (key: string | undefined) => {
	const imageRequest = JSON.stringify({
		bucket: profilePhotoBucket,
		key: key,
		edits: {
			resize: {
				width: 200,
			},
		},
	});
	const encodedObject = btoa(imageRequest);
	return `${photoUploadCloudfrontUrl}/${encodedObject}`;
};

export const createBannerPhotoUrlForCloudfront = (key: string | undefined) => {
	const imageRequest = JSON.stringify({
		bucket: bannerPhotoBucket,
		key: key,
		edits: {
			resize: {
				width: 1600,
				height: 400,
			},
		},
	});
	const encodedObject = btoa(imageRequest);
	return `${photoUploadCloudfrontUrl}/${encodedObject}`;
};

export const createPackPhotoUrlForCloudfront = (key: string | undefined) => {
	const imageRequest = JSON.stringify({
		bucket: packPhotoBucket,
		key: key,
		edits: {
			resize: {
				width: 600,
				height: 400,
			},
		},
	});
	const encodedObject = btoa(imageRequest);
	return `${photoUploadCloudfrontUrl}/${encodedObject}`;
};
