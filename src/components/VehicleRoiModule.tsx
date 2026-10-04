import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Car as CarIcon,
  Wrench,
  Award,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Percent,
  Calendar,
} from 'lucide-react';
import {
  Car,
  RentalContract,
  MaintenanceRecord,
  CorporateContract,
  DeliveryService,
  AppSettings,
  Currency,
  Language,
} from '../types';
import { formatCurrency } from '../translations/i18n';
import { exportToExcel } from '../utils/excelExport';

interface VehicleRoiModuleProps {
  cars: Car[];
  contracts: RentalContract[];
  maintenanceRecords: MaintenanceRecord[];
  corporateContracts?: CorporateContract[];
  deliveries?: DeliveryService[];
  settings: AppSettings;
  currency: Currency;
  lang: Language;
}

export const VehicleRoiModule: React.FC<VehicleRoiModuleProps> = ({
  cars,
  contracts,
  maintenanceRecords,
  corporateContracts = [],
  deliveries = [],
  settings,
  currency,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'netProfit' | 'revenue' | 'maintenance'>('roi');
  const [selectedCarDetails, setSelectedCarDetails] = useState<Car | null>(null);

  // Compute analytics for each car
  const carsAnalytics = useMemo(() => {
    return cars.map((car) => {
      // 1. Incomes from regular rental contracts
      const carContracts = contracts.filter((c) => c.carId === car.id);
      const rentalRevenue = carContracts.reduce((sum, c) => sum + (c.paidAmount || c.totalAmount || 0), 0);
      const rentalDays = carContracts.reduce((sum, c) => sum + (c.totalDays || 1), 0);

      // 2. Incomes from deliveries assigned to this car
      const carDeliveries = deliveries.filter((d) => d.carId === car.id);
      const deliveryRevenue = carDeliveries.reduce((sum, d) => sum + (d.price || 0), 0);

      const totalRevenue = rentalRevenue + deliveryRevenue;

      // 3. Maintenance Expenses
      const carMaint = maintenanceRecords.filter((m) => m.carId === car.id);
      const totalMaintenanceCost = carMaint.reduce((sum, m) => sum + (m.cost || 0), 0);

      // 4. Acquisition / Base Value
      const carBaseValue = car.salePrice || (car.dailyRate * 300) || 50000;

      // 5. Net Operating Profit
      const netProfit = totalRevenue - totalMaintenanceCost;

      // 6. ROI %
      const roiPercent = carBaseValue > 0 ? ((netProfit / carBaseValue) * 100) : 0;

      // 7. Occupancy / Utilization (Assume 365 days base)
      const occupancyRate = Math.min(100, Math.round((rentalDays / 365) * 100));

      return {
        car,
        contractsCount: carContracts.length,
        rentalDays,
        totalRevenue,
        totalMaintenanceCost,
        netProfit,
        roiPercent,
        occupancyRate,
        carBaseValue,
        maintenanceCount: carMaint.length,
      };
    });
  }, [cars, contracts, maintenanceRecords, deliveries]);

  // Overall Fleet Totals
  const fleetTotals = useMemo(() => {
    const totalFleetRevenue = carsAnalytics.reduce((s, c) => s + c.totalRevenue, 0);
    const totalFleetMaint = carsAnalytics.reduce((s, c) => s + c.totalMaintenanceCost, 0);
    const totalFleetNetProfit = totalFleetRevenue - totalFleetMaint;
    const totalFleetInvestment = carsAnalytics.reduce((s, c) => s + c.carBaseValue, 0);
    const averageFleetRoi = totalFleetInvestment > 0 ? (totalFleetNetProfit / totalFleetInvestment) * 100 : 0;
    
    // Top performing car
    const sortedByProfit = [...carsAnalytics].sort((a, b) => b.netProfit - a.netProfit);
    const topPerformingCar = sortedByProfit[0];

    return {
      totalFleetRevenue,
      totalFleetMaint,
      totalFleetNetProfit,
      averageFleetRoi,
      topPerformingCar,
    };
  }, [carsAnalytics]);

  // Filtered and Sorted list
  const filteredAnalytics = useMemo(() => {
    return carsAnalytics
      .filter((item) => {
        const matchesSearch =
          item.car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'all' || item.car.category === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'roi') return b.roiPercent - a.roiPercent;
        if (sortBy === 'netProfit') return b.netProfit - a.netProfit;
        if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'maintenance') return b.totalMaintenanceCost - a.totalMaintenanceCost;
        return 0;
      });
  }, [carsAnalytics, searchTerm, selectedCategory, sortBy]);

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredAnalytics.map((item) => ({
      brandModel: `${item.car.brand} ${item.car.model} (${item.car.year})`,
      plateNumber: item.car.plateNumber,
      category: item.car.category,
      baseValue: `${item.carBaseValue} ${currency}`,
      totalRevenue: `${item.totalRevenue} ${currency}`,
      maintenanceCost: `${item.totalMaintenanceCost} ${currency}`,
      netProfit: `${item.netProfit} ${currency}`,
      roi: `${item.roiPercent.toFixed(1)}%`,
      occupancy: `${item.occupancyRate}%`,
      contractsCount: item.contractsCount,
    }));

    exportToExcel({
      fileName: `Vehicle_ROI_Report_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Vehicle ROI Analysis',
      title: lang === 'ar' ? 'تقرير تحليل أرباح وخسائر وعائد استثمار الأسطول' : 'Fleet ROI & P&L Analysis Report',
      subtitle: `${settings.organizationName || settings.appName} - ${new Date().toLocaleDateString()}`,
      columns: [
        { header: lang === 'ar' ? 'السيارة والموديل' : 'Vehicle Model', key: 'brandModel' },
        { header: lang === 'ar' ? 'رقم اللوحة' : 'Plate Number', key: 'plateNumber' },
        { header: lang === 'ar' ? 'الفئة' : 'Category', key: 'category' },
        { header: lang === 'ar' ? 'القيمة الرأسمالية' : 'Acquisition Value', key: 'baseValue' },
        { header: lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue', key: 'totalRevenue' },
        { header: lang === 'ar' ? 'تكاليف الصيانة' : 'Maintenance Cost', key: 'maintenanceCost' },
        { header: lang === 'ar' ? 'صافي الربح' : 'Net Profit', key: 'netProfit' },
        { header: lang === 'ar' ? 'عائد الاستثمار (ROI)' : 'ROI %', key: 'roi' },
        { header: lang === 'ar' ? 'معدل الإشغال' : 'Occupancy Rate', key: 'occupancy' },
        { header: lang === 'ar' ? 'عدد العقود' : 'Contracts Count', key: 'contractsCount' },
      ],
      data,
      summaryRows: [
        { label: lang === 'ar' ? 'إجمالي إيرادات الأسطول' : 'Total Fleet Revenue', value: `${fleetTotals.totalFleetRevenue.toLocaleString()} ${currency}` },
        { label: lang === 'ar' ? 'إجمالي تكاليف الصيانة' : 'Total Maintenance Cost', value: `${fleetTotals.totalFleetMaint.toLocaleString()} ${currency}` },
        { label: lang === 'ar' ? 'صافي أرباح الأسطول' : 'Total Net Fleet Profit', value: `${fleetTotals.totalFleetNetProfit.toLocaleString()} ${currency}` },
        { label: lang === 'ar' ? 'متوسط العائد على الاستثمار' : 'Average Fleet ROI', value: `${fleetTotals.averageFleetRoi.toFixed(1)}%` },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {lang === 'ar' ? 'تحليل أرباح وخسائر وعائد الاستثمار لكل سيارة (Vehicle ROI & P&L)' : 'Vehicle ROI & Profit/Loss Analysis'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'مقارنة إيرادات كل سيارة مقابل مصاريف صيانتها واستهلاكها لحساب صافي الربح الفعلي ومعدل العائد'
                  : 'Track revenues, service costs, net profit, and ROI % per vehicle in your fleet'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{lang === 'ar' ? 'تصدير تقرير الإكسل' : 'Export Excel Report'}</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 mb-1">{lang === 'ar' ? 'إجمالي إيرادات الأسطول' : 'Total Fleet Revenue'}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(fleetTotals.totalFleetRevenue, currency, lang)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 mb-1">{lang === 'ar' ? 'إجمالي تكاليف الصيانة' : 'Total Maintenance Cost'}</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatCurrency(fleetTotals.totalFleetMaint, currency, lang)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 mb-1">{lang === 'ar' ? 'صافي أرباح التشغيل' : 'Net Operating Profit'}</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(fleetTotals.totalFleetNetProfit, currency, lang)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 mb-1">{lang === 'ar' ? 'متوسط العائد على الاستثمار (ROI)' : 'Average Fleet ROI'}</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {fleetTotals.averageFleetRoi.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Filters & Sorting */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالماركة، الموديل، رقم اللوحة...' : 'Search by model, brand, plate...'}
            className="w-full pl-3 pr-9 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="all">{lang === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
            <option value="sedan">سيدان / Sedan</option>
            <option value="suv">دفع رباعي / SUV</option>
            <option value="economy">اقتصادية / Economy</option>
            <option value="luxury">فاخرة / Luxury</option>
            <option value="delivery_van">فان ونقل / Van</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="roi">{lang === 'ar' ? 'ترتيب حسب: أعلى ROI %' : 'Sort by: Highest ROI %'}</option>
            <option value="netProfit">{lang === 'ar' ? 'ترتيب حسب: صافي الأرباح' : 'Sort by: Net Profit'}</option>
            <option value="revenue">{lang === 'ar' ? 'ترتيب حسب: إجمالي الإيرادات' : 'Sort by: Total Revenue'}</option>
            <option value="maintenance">{lang === 'ar' ? 'ترتيب حسب: أعلى مصاريف صيانة' : 'Sort by: Maintenance Costs'}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <th className="p-3.5">#</th>
                <th className="p-3.5">{lang === 'ar' ? 'السيارة والموديل' : 'Vehicle Model'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'اللوحة' : 'Plate'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'القيمة الرأسمالية' : 'Acquisition Value'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'إجمالي الإيرادات' : 'Revenues'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'تكاليف الصيانة' : 'Maintenance'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'صافي الربح' : 'Net Profit'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'عائد الاستثمار (ROI)' : 'ROI %'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'نسبة الإشغال' : 'Occupancy'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAnalytics.map((item, idx) => {
                const isProfitable = item.netProfit >= 0;
                return (
                  <tr key={item.car.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-bold text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        {item.car.photoUrl ? (
                          <img src={item.car.photoUrl} alt="" className="w-10 h-7 object-cover rounded border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <CarIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                            {item.car.brand} {item.car.model}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.car.year} • {item.car.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.car.plateNumber}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(item.carBaseValue, currency, lang)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.totalRevenue, currency, lang)}
                      <span className="block text-[10px] text-slate-400 font-normal">({item.contractsCount} عقود)</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(item.totalMaintenanceCost, currency, lang)}
                      <span className="block text-[10px] text-slate-400 font-normal">({item.maintenanceCount} خدمات)</span>
                    </td>
                    <td className="p-3.5 font-mono font-black text-sm">
                      <span className={isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                        {formatCurrency(item.netProfit, currency, lang)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs">
                        {isProfitable ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                        <span>{item.roiPercent.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>{item.rentalDays} يوم</span>
                          <span>{item.occupancyRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${item.occupancyRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAnalytics.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {lang === 'ar' ? 'لا توجد سيارات مطابقة للبحث' : 'No cars match the search criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
