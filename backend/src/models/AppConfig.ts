import mongoose, { Document, Schema } from 'mongoose';

export interface IAppConfig extends Document {
  minVersion:      string;
  latestVersion:   string;
  apkDownloadUrl:  string;
  androidStoreUrl: string;
  iosStoreUrl:     string;
}

const AppConfigSchema = new Schema<IAppConfig>(
  {
    minVersion:      { type: String, default: '1.0.0' },
    latestVersion:   { type: String, default: '1.0.0' },
    apkDownloadUrl:  { type: String, default: '' },
    androidStoreUrl: { type: String, default: '' },
    iosStoreUrl:     { type: String, default: '' },
  },
  { timestamps: true },
);

export const AppConfig = mongoose.model<IAppConfig>('AppConfig', AppConfigSchema);
