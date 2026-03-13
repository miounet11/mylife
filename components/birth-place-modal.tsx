'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import PickerWheelColumn, { type PickerWheelOption } from './picker-wheel-column';
import { CHINA_REGIONS } from '@/lib/location-engine/china-regions';
import { WORLD_REGIONS } from '@/lib/location-engine/world-regions';
import { buildChinaLocation, timezoneOffsetFromLabel, type LocationOption } from '@/lib/location-engine';
import { UNKNOWN_LOCATION } from '@/lib/paipan-form';

interface BirthPlaceModalProps {
  isOpen: boolean;
  tabIndex: 0 | 1;
  addressData: string[];
  isBJTime: boolean;
  onClose: () => void;
  onTabChange: (nextTab: 0 | 1) => void;
  onConfirm: (payload: {
    tabIndex: 0 | 1;
    addressData: string[];
    location: LocationOption;
    isBJTime: boolean;
  }) => void;
}

interface DomesticDistrict {
  text: string;
  gisGcj02Lat: number;
  gisGcj02Lng: number;
}

interface DomesticCity {
  text: string;
  children: DomesticDistrict[];
}

interface DomesticProvince {
  text: string;
  children: DomesticCity[];
}

interface OverseasCity {
  text: string;
  zone: number;
  lng: number;
  lat: number;
}

interface OverseasCountry {
  name: string;
  text: string;
  zone: number;
  children: OverseasCity[];
}

interface SearchResult {
  text: string;
  htmlText: string;
  indexes: number[];
  disabled?: boolean;
}

const TABS: Array<{ id: 0 | 1; label: string }> = [
  { id: 0, label: '国内' },
  { id: 1, label: '海外' },
];

function highlightText(text: string, keyword: string) {
  if (!keyword) {
    return text;
  }

  return text.replace(new RegExp(keyword, 'gi'), (match) => `<span style="color:#b2955d">${match}</span>`);
}

function buildDomesticTree(): DomesticProvince[] {
  return [
    {
      text: '未知地',
      children: [
        {
          text: '北京时间',
          children: [{ text: '--', gisGcj02Lat: 39.9288, gisGcj02Lng: 116.416 }],
        },
      ],
    },
    ...CHINA_REGIONS.map((province) => ({
      text: province.name,
      children: province.cities.map((city) => ({
        text: city.name,
        children: (city.districts.length > 0 ? city.districts : [{ name: '--', longitude: city.longitude, latitude: city.latitude }]).map((district) => ({
          text: district.name,
          gisGcj02Lat: district.latitude,
          gisGcj02Lng: district.longitude,
        })),
      })),
    })),
  ];
}

function buildOverseasTree(): OverseasCountry[] {
  return WORLD_REGIONS.flatMap((continent) =>
    continent.countries
      .filter((country) => country.latitude >= 0)
      .map((country) => {
        const zone = timezoneOffsetFromLabel(country.timezone);
        return {
          name: country.name,
          text: `${country.name}GMT${zone >= 0 ? '+' : ''}${zone}`,
          zone,
          children: country.cities
            .filter((city) => city.latitude >= 0)
            .map((city) => ({
              text: city.name,
              zone: timezoneOffsetFromLabel(city.timezone),
              lng: city.longitude,
              lat: city.latitude,
            })),
        };
      })
      .filter((country) => country.children.length > 0)
  );
}

function findDomesticIndexes(tree: DomesticProvince[], addressData: string[]) {
  const provinceIndex = tree.findIndex(
    (province) => province.text.includes(addressData[0] || '') || (addressData[0] || '').includes(province.text)
  );

  if (provinceIndex < 0) {
    return [0, 0, 0] as [number, number, number];
  }

  const cityIndex = tree[provinceIndex].children.findIndex(
    (city) => city.text.includes(addressData[1] || '') || (addressData[1] || '').includes(city.text)
  );
  const safeCityIndex = cityIndex < 0 ? 0 : cityIndex;

  const districtIndex = tree[provinceIndex].children[safeCityIndex].children.findIndex(
    (district) => district.text.includes(addressData[2] || '') || (addressData[2] || '').includes(district.text)
  );

  return [provinceIndex, safeCityIndex, districtIndex < 0 ? 0 : districtIndex] as [number, number, number];
}

function findOverseasIndexes(tree: OverseasCountry[], addressData: string[]) {
  const countryIndex = tree.findIndex(
    (country) => country.name.includes(addressData[0] || '') || (addressData[0] || '').includes(country.name)
  );

  if (countryIndex < 0) {
    return [0, 0] as [number, number];
  }

  const cityIndex = tree[countryIndex].children.findIndex(
    (city) => city.text.includes(addressData[1] || '') || (addressData[1] || '').includes(city.text)
  );

  return [countryIndex, cityIndex < 0 ? 0 : cityIndex] as [number, number];
}

export default function BirthPlaceModal({
  isOpen,
  tabIndex,
  addressData,
  isBJTime,
  onClose,
  onTabChange,
  onConfirm,
}: BirthPlaceModalProps) {
  const domesticTree = useMemo(() => buildDomesticTree(), []);
  const overseasTree = useMemo(() => buildOverseasTree(), []);
  const [activeTab, setActiveTab] = useState<0 | 1>(tabIndex);
  const [searchValue, setSearchValue] = useState('');
  const [showSearchPopover, setShowSearchPopover] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [domesticIndexes, setDomesticIndexes] = useState<[number, number, number]>([0, 0, 0]);
  const [overseasIndexes, setOverseasIndexes] = useState<[number, number]>([0, 0]);
  const [isBeijingTime, setIsBeijingTime] = useState(isBJTime);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveTab(tabIndex);
    setSearchValue('');
    setShowSearchPopover(false);
    setSearchResults([]);
    setDomesticIndexes(findDomesticIndexes(domesticTree, addressData));
    setOverseasIndexes(findOverseasIndexes(overseasTree, addressData));
    setIsBeijingTime(isBJTime);
  }, [addressData, domesticTree, isBJTime, isOpen, overseasTree, tabIndex]);

  const domesticProvince = domesticTree[domesticIndexes[0]] ?? domesticTree[0];
  const domesticCities = domesticProvince.children;
  const domesticCity = domesticCities[domesticIndexes[1]] ?? domesticCities[0];
  const domesticDistricts = domesticCity.children;
  const domesticDistrict = domesticDistricts[domesticIndexes[2]] ?? domesticDistricts[0];

  const overseasCountry = overseasTree[overseasIndexes[0]] ?? overseasTree[0];
  const overseasCities = overseasCountry.children;
  const overseasCity = overseasCities[overseasIndexes[1]] ?? overseasCities[0];

  const domesticProvinceOptions = useMemo<PickerWheelOption[]>(
    () => domesticTree.map((item) => ({ value: item.text, label: item.text })),
    [domesticTree]
  );
  const domesticCityOptions = useMemo<PickerWheelOption[]>(
    () => domesticCities.map((item) => ({ value: item.text, label: item.text })),
    [domesticCities]
  );
  const domesticDistrictOptions = useMemo<PickerWheelOption[]>(
    () => domesticDistricts.map((item) => ({ value: item.text, label: item.text })),
    [domesticDistricts]
  );
  const overseasCountryOptions = useMemo<PickerWheelOption[]>(
    () => overseasTree.map((item) => ({ value: item.name, label: item.text })),
    [overseasTree]
  );
  const overseasCityOptions = useMemo<PickerWheelOption[]>(
    () => overseasCities.map((item) => ({ value: item.text, label: item.text })),
    [overseasCities]
  );

  useEffect(() => {
    if (!showSearchPopover) {
      return;
    }

    const keyword = searchValue.trim();
    if (!keyword) {
      setSearchResults([]);
      return;
    }

    const nextResults: SearchResult[] = [];

    if (activeTab === 0) {
      domesticTree.forEach((province, provinceIndex) => {
        province.children.forEach((city, cityIndex) => {
          city.children.forEach((district, districtIndex) => {
            const matched = [province.text, city.text, district.text].some(
              (value) => value.includes(keyword) || keyword.includes(value)
            );
            if (!matched) {
              return;
            }
            const text = `${province.text} - ${city.text} - ${district.text}`;
            nextResults.push({
              text,
              htmlText: highlightText(text, keyword),
              indexes: [provinceIndex, cityIndex, districtIndex],
            });
          });
        });
      });
    } else {
      overseasTree.forEach((country, countryIndex) => {
        country.children.forEach((city, cityIndex) => {
          const matched = [country.name, city.text].some((value) => value.includes(keyword) || keyword.includes(value));
          if (!matched) {
            return;
          }
          const text = `${country.text} - ${city.text}`;
          nextResults.push({
            text,
            htmlText: highlightText(text, keyword),
            indexes: [countryIndex, cityIndex],
          });
        });
      });
    }

    if (!nextResults.length) {
      setSearchResults([{ text: '未找到相关地区', htmlText: '未找到相关地区', indexes: [], disabled: true }]);
      return;
    }

    setSearchResults(nextResults);
  }, [activeTab, domesticTree, overseasTree, searchValue, showSearchPopover]);

  if (!isOpen) {
    return null;
  }

  const handleSelectSearch = (item: SearchResult) => {
    if (item.disabled) {
      return;
    }

    setSearchValue(item.text);
    setShowSearchPopover(false);

    if (activeTab === 0) {
      setDomesticIndexes(item.indexes as [number, number, number]);
      return;
    }

    setOverseasIndexes(item.indexes as [number, number]);
  };

  const handleConfirm = () => {
    if (activeTab === 0) {
      if (domesticProvince.text === '未知地') {
        onConfirm({
          tabIndex: 0,
          addressData: ['未知地', '北京时间', '--'],
          location: UNKNOWN_LOCATION.option as LocationOption,
          isBJTime: false,
        });
        onClose();
        return;
      }

      const location = buildChinaLocation(domesticProvince.text, domesticCity.text, domesticDistrict.text) ?? (UNKNOWN_LOCATION.option as LocationOption);
      onConfirm({
        tabIndex: 0,
        addressData: [domesticProvince.text, domesticCity.text, domesticDistrict.text],
        location,
        isBJTime: false,
      });
      onClose();
      return;
    }

    const location: LocationOption = {
      id: `world:${overseasCountry.name}:${overseasCity.text}:${overseasCity.lng}:${overseasCity.zone}`,
      scope: 'world',
      displayName: overseasCity.text,
      fullName: `${overseasCountry.name} ${overseasCity.text}`,
      country: overseasCountry.name,
      countryEn: overseasCountry.name,
      city: overseasCity.text,
      nameEn: overseasCity.text,
      lng: overseasCity.lng,
      lat: overseasCity.lat,
      tz: overseasCity.zone,
      timezoneLabel: `UTC${overseasCity.zone >= 0 ? '+' : ''}${overseasCity.zone}`,
    };

    onConfirm({
      tabIndex: 1,
      addressData: [overseasCountry.name, overseasCity.text],
      location,
      isBJTime: isBeijingTime,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="relative flex h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-[390px] rounded-[20px] bg-white p-[17px] text-[#101010]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative flex h-[53px] items-center justify-center">
            <button type="button" onClick={onClose} className="absolute right-0 p-1 text-[#7b7b7b]">
              <X className="h-4 w-4" />
            </button>

            <div className="flex rounded-full border border-[rgba(221,221,221,1)] text-[13px]">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowSearchPopover(false);
                    onTabChange(item.id);
                  }}
                  className={`flex h-[29px] w-[87px] items-center justify-center rounded-full ${
                    activeTab === item.id ? 'bg-[#b2955d] text-white' : 'text-[#444444]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 z-10 h-4 w-4 text-[#9e9e9e]" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => setShowSearchPopover(true)}
              placeholder="搜索全国城市及地区"
              className="h-[36px] flex-1 rounded-full border border-[rgba(187,187,187,0.5)] pl-9 pr-4 text-[14px] outline-none placeholder:text-[#9e9e9e]"
            />
            {showSearchPopover ? (
              <button
                type="button"
                onClick={() => setShowSearchPopover(false)}
                className="ml-3 whitespace-nowrap text-[14px] text-[#666666]"
              >
                取消
              </button>
            ) : null}

            {showSearchPopover ? (
              <div className="absolute left-0 right-0 top-[50px] z-20 max-h-[250px] overflow-y-auto bg-white py-1 shadow-[0_18px_40px_rgba(16,16,16,0.08)]">
                {searchResults.map((item, index) => (
                  <button
                    key={`${item.text}-${index}`}
                    type="button"
                    onClick={() => handleSelectSearch(item)}
                    className="block w-full px-4 py-3 text-left text-[15px] text-[#444444]"
                    disabled={item.disabled}
                    dangerouslySetInnerHTML={{ __html: item.htmlText }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-[13px] w-full">
            <div className="flex h-[40px] items-center justify-around border-t border-[rgba(233,233,233,0.6)] text-[14px] text-[#666666]">
              {(activeTab === 0 ? ['省份', '城市', '区县'] : ['国家', '地区']).map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>

            {activeTab === 0 ? (
              <div className="grid grid-cols-3 gap-1">
                <PickerWheelColumn
                  label="省份"
                  options={domesticProvinceOptions}
                  value={domesticProvince.text}
                  onChange={(value) => {
                    const provinceIndex = domesticTree.findIndex((item) => item.text === value);
                    setDomesticIndexes([provinceIndex, 0, 0]);
                  }}
                />
                <PickerWheelColumn
                  label="城市"
                  options={domesticCityOptions}
                  value={domesticCity.text}
                  onChange={(value) => {
                    const cityIndex = domesticCities.findIndex((item) => item.text === value);
                    setDomesticIndexes(([provinceIndex]) => [provinceIndex, cityIndex, 0]);
                  }}
                />
                <PickerWheelColumn
                  label="区县"
                  options={domesticDistrictOptions}
                  value={domesticDistrict.text}
                  onChange={(value) => {
                    const districtIndex = domesticDistricts.findIndex((item) => item.text === value);
                    setDomesticIndexes(([provinceIndex, cityIndex]) => [provinceIndex, cityIndex, districtIndex]);
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                <PickerWheelColumn
                  label="国家"
                  options={overseasCountryOptions}
                  value={overseasCountry.name}
                  onChange={(value) => {
                    const countryIndex = overseasTree.findIndex((item) => item.name === value);
                    setOverseasIndexes([countryIndex, 0]);
                  }}
                />
                <PickerWheelColumn
                  label="地区"
                  options={overseasCityOptions}
                  value={overseasCity.text}
                  onChange={(value) => {
                    const cityIndex = overseasCities.findIndex((item) => item.text === value);
                    setOverseasIndexes(([countryIndex]) => [countryIndex, cityIndex]);
                  }}
                />
              </div>
            )}
          </div>

          <div className="relative z-10 mt-3 min-h-[30px] bg-white">
            {activeTab === 1 ? (
              <div className="flex items-center justify-end gap-2 text-[14px] text-[#444444]">
                <span>换算北京时间</span>
                <span className="text-[10px] text-[#797979]">(默认关闭)</span>
                <button
                  type="button"
                  onClick={() => setIsBeijingTime((current) => !current)}
                  className={`relative h-[24px] w-[46px] rounded-full transition ${
                    isBeijingTime ? 'bg-[#b2955d]' : 'bg-[#d6d6d6]'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] h-[20px] w-[20px] rounded-full bg-white transition ${
                      isBeijingTime ? 'left-[24px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="mt-4 flex h-[54px] w-full items-center justify-center rounded-full bg-[#101010] font-serif text-[18px] font-bold text-[#f7d3a1]"
          >
            确定
          </button>

          {activeTab === 1 ? (
            <div className="mt-[10px] text-[12px] text-[#525252]">目前仅支持北半球国家</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
