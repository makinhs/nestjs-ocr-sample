import { Injectable } from '@nestjs/common';
import { OcrService } from './ocr/ocr.service';

@Injectable()
export class AppService {
  constructor(private readonly ocrService: OcrService) {}
  getHello(): string {
    return 'Hello World!';
  }

  regexForAnyCurrency = /\d+(?:[.,]\d{0,2})?/;
  regexWithLetter = /\d+(?:[.,]\d{0,2})?\x20[DBO0]/;
  TOTAL_AMOUNT_PAID = 'IMPORTO PAGATO';

  parseLocaleNumber(stringNumber, locale) {
    const thousandSeparator = Intl.NumberFormat(locale)
      .format(11111)
      .replace(/\p{Number}/gu, '');
    const decimalSeparator = Intl.NumberFormat(locale)
      .format(1.1)
      .replace(/\p{Number}/gu, '');

    return parseFloat(
      stringNumber
        .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
        .replace(new RegExp('\\' + decimalSeparator), '.'),
    );
  }

  parseReceipt(arrayText: Array<string>) {
    const itemsFound = [];
    const totalAmountPaid = [];
    for (const value of arrayText) {
      if (value.match(this.regexWithLetter)) {
        itemsFound.push({
          item: value.split(this.regexWithLetter)[0].trim(),
          value: this.parseLocaleNumber(
            value.match(this.regexWithLetter)[0].split(' ')[0],
            'de',
          ),
        });
      }
      if (value.indexOf(this.TOTAL_AMOUNT_PAID) > -1) {
        totalAmountPaid.push({
          item: this.TOTAL_AMOUNT_PAID,
          value: this.parseLocaleNumber(
            value.match(this.regexForAnyCurrency)[0],
            'it',
          ),
        });
      }
    }

    let totalItemsSum = 0;
    itemsFound.forEach(({ value }) => {
      totalItemsSum += value;
    });
    return {
      totalItemsSum,
      totalAmountPaid,
      itemsFound,
    };
  }

  async parseImage(imageBuffer) {
    return this.parseReceipt(await this.ocrService.parseImage(imageBuffer));
  }
}
