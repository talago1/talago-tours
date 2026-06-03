import QRScannerTerminal from '@/components/admin/QRScannerTerminal';

export const metadata = {
  title: 'QR Scanner | Talago Tours',
  description: 'Scan passenger QR codes for check-in.',
};

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">QR Check-In Scanner</h1>
        <p className="mt-1 text-sm text-gray-500">
          Point the camera at a passenger&apos;s boarding pass to check them in.
        </p>
      </div>
      <QRScannerTerminal />
    </div>
  );
}
