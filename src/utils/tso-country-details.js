/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import flagAL from '../images/flags/flags-iso/flat/svg/AL.svg';
import flagAT from '../images/flags/flags-iso/flat/svg/AT.svg';
import flagBA from '../images/flags/flags-iso/flat/svg/BA.svg';
import flagBE from '../images/flags/flags-iso/flat/svg/BE.svg';
import flagBG from '../images/flags/flags-iso/flat/svg/BG.svg';
import flagCH from '../images/flags/flags-iso/flat/svg/CH.svg';
import flagCZ from '../images/flags/flags-iso/flat/svg/CZ.svg';
import flagDE from '../images/flags/flags-iso/flat/svg/DE.svg';
import flagES from '../images/flags/flags-iso/flat/svg/ES.svg';
import flagFR from '../images/flags/flags-iso/flat/svg/FR.svg';
import flagGR from '../images/flags/flags-iso/flat/svg/GR.svg';
import flagHR from '../images/flags/flags-iso/flat/svg/HR.svg';
import flagHU from '../images/flags/flags-iso/flat/svg/HU.svg';
import flagIT from '../images/flags/flags-iso/flat/svg/IT.svg';
import flagME from '../images/flags/flags-iso/flat/svg/ME.svg';
import flagMK from '../images/flags/flags-iso/flat/svg/MK.svg';
import flagNL from '../images/flags/flags-iso/flat/svg/NL.svg';
import flagPL from '../images/flags/flags-iso/flat/svg/PL.svg';
import flagPT from '../images/flags/flags-iso/flat/svg/PT.svg';
import flagRO from '../images/flags/flags-iso/flat/svg/RO.svg';
import flagRS from '../images/flags/flags-iso/flat/svg/RS.svg';
import flagSI from '../images/flags/flags-iso/flat/svg/SI.svg';
import flagSK from '../images/flags/flags-iso/flat/svg/SK.svg';
import flagTR from '../images/flags/flags-iso/flat/svg/TR.svg';
import flagUA from '../images/flags/flags-iso/flat/svg/UA.svg';
import flagUnknown from '../images/flags/flags-iso/flat/svg/EU.svg';

export function getDetailsByCountryOrTso(countryOrTsoCode) {
    switch (countryOrTsoCode) {
        case 'AL':
            return {
                countryCode: 'AL',
                countryName: 'Albania',
                flagSrc: flagAL,
            };
        case 'AT':
            return {
                countryCode: 'AT',
                countryName: 'Austria',
                flagSrc: flagAT,
            };
        case 'BA':
            return {
                countryCode: 'BA',
                countryName: 'Bosnia and Herzegovina',
                flagSrc: flagBA,
            };
        case 'BE':
        case 'ELIA':
            return {
                countryCode: 'BE',
                countryName: 'Belgium',
                flagSrc: flagBE,
            };
        case 'BG':
            return {
                countryCode: 'BG',
                countryName: 'Bulgaria',
                flagSrc: flagBG,
            };
        case 'CH':
            return {
                countryCode: 'CH',
                countryName: 'Switzerland',
                flagSrc: flagCH,
            };
        case 'CZ':
            return {
                countryCode: 'CZ',
                countryName: 'Czech Republic',
                flagSrc: flagCZ,
            };
        case 'DE':
            return {
                countryCode: 'DE',
                countryName: 'Germany',
                flagSrc: flagDE,
            };
        case 'ES':
        case 'REE':
            return { countryCode: 'ES', countryName: 'Spain', flagSrc: flagES };
        case 'FR':
        case 'RTEFRANCE':
            return {
                countryCode: 'FR',
                countryName: 'France',
                flagSrc: flagFR,
            };
        case 'GR':
            return {
                countryCode: 'GR',
                countryName: 'Greece',
                flagSrc: flagGR,
            };
        case 'HR':
            return {
                countryCode: 'HR',
                countryName: 'Croatia',
                flagSrc: flagHR,
            };
        case 'HU':
            return {
                countryCode: 'HU',
                countryName: 'Hungary',
                flagSrc: flagHU,
            };
        case 'IT':
            return { countryCode: 'IT', countryName: 'Italy', flagSrc: flagIT };
        case 'ME':
            return {
                countryCode: 'ME',
                countryName: 'Montenegro',
                flagSrc: flagME,
            };
        case 'MK':
            return {
                countryCode: 'MK',
                countryName: 'North Macedonia',
                flagSrc: flagMK,
            };
        case 'NL':
        case 'TTN':
            return {
                countryCode: 'NL',
                countryName: 'Netherlands',
                flagSrc: flagNL,
            };
        case 'PL':
            return {
                countryCode: 'PL',
                countryName: 'Poland',
                flagSrc: flagPL,
            };
        case 'PT':
        case 'REN':
            return {
                countryCode: 'PT',
                countryName: 'Portugal',
                flagSrc: flagPT,
            };
        case 'RO':
            return {
                countryCode: 'RO',
                countryName: 'Romania',
                flagSrc: flagRO,
            };
        case 'RS':
            return {
                countryCode: 'RS',
                countryName: 'Serbia',
                flagSrc: flagRS,
            };
        case 'SI':
            return {
                countryCode: 'SI',
                countryName: 'Slovenia',
                flagSrc: flagSI,
            };
        case 'SK':
            return {
                countryCode: 'SK',
                countryName: 'Slovakia',
                flagSrc: flagSK,
            };
        case 'TR':
            return {
                countryCode: 'TR',
                countryName: 'Turkey',
                flagSrc: flagTR,
            };
        case 'UA':
            return {
                countryCode: 'UA',
                countryName: 'Ukraine',
                flagSrc: flagUA,
            };
        default:
            return { countryCode: '', countryName: '', flagSrc: flagUnknown };
    }
}
