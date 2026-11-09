export const INDIAN_STATES: { [code: string]: string } = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export function getStateNameByCode(code: string): string {
  return INDIAN_STATES[code] || INDIAN_STATES[code.padStart(2, '0')] || 'Unknown State';
}

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹ 0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDateIN(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTimeIN(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

/**
 * Converts a number to words in Indian Lakhs/Crores numbering format
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return 'Rupees Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return a[n];
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return b[tens] + (ones > 0 ? ' ' + a[ones] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    let str = '';
    if (hundreds > 0) str += a[hundreds] + ' Hundred';
    if (remainder > 0) {
      if (str) str += ' and ';
      str += convertTwoDigits(remainder);
    }
    return str;
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let crores = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;
  let lakhs = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousands = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  let hundreds = remainder;

  const parts: string[] = [];
  if (crores > 0) parts.push(convertThreeDigits(crores) + ' Crore');
  if (lakhs > 0) parts.push(convertTwoDigits(lakhs) + ' Lakh');
  if (thousands > 0) parts.push(convertTwoDigits(thousands) + ' Thousand');
  if (hundreds > 0) parts.push(convertThreeDigits(hundreds));

  let words = parts.join(' ');
  if (!words) words = 'Zero';

  let result = 'Rupees ' + words;
  if (decimalPart > 0) {
    result += ' and ' + convertTwoDigits(decimalPart) + ' Paise';
  }
  return result + ' Only';
}

/**
 * Calculate Tax details based on state codes
 */
export function calculateItemTaxes(
  taxableAmount: number,
  taxRatePercent: number,
  consignorStateCode: string,
  consigneeStateCode: string
) {
  const isInterState = consignorStateCode.padStart(2, '0') !== consigneeStateCode.padStart(2, '0');
  
  if (isInterState) {
    const igstAmount = (taxableAmount * taxRatePercent) / 100;
    return {
      isInterState: true,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: taxRatePercent,
      igstAmount: Number(igstAmount.toFixed(2)),
      totalAmount: Number((taxableAmount + igstAmount).toFixed(2)),
    };
  } else {
    const halfRate = taxRatePercent / 2;
    const cgstAmount = (taxableAmount * halfRate) / 100;
    const sgstAmount = (taxableAmount * halfRate) / 100;
    return {
      isInterState: false,
      cgstRate: halfRate,
      cgstAmount: Number(cgstAmount.toFixed(2)),
      sgstRate: halfRate,
      sgstAmount: Number(sgstAmount.toFixed(2)),
      igstRate: 0,
      igstAmount: 0,
      totalAmount: Number((taxableAmount + cgstAmount + sgstAmount).toFixed(2)),
    };
  }
}
