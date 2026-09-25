export class AppDownloader {
  static downloadNativeBinary(platform: 'win' | 'mac' | 'linux' | 'apk') {
    const filenameMap = {
      win: 'VietsubVideoStudio-Setup.exe',
      mac: 'VietsubVideoStudio.dmg',
      linux: 'VietsubVideoStudio.AppImage',
      apk: 'VietsubVideoStudio.apk',
    };
    const content = `Native installer package for ${platform.toUpperCase()}`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filenameMap[platform];
    a.click();
    URL.revokeObjectURL(url);
  }
}
