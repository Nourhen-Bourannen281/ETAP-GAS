import React from 'react';

const StockAlertList = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-green-500 text-xl mr-3">✅</span>
          <p className="text-green-700">Aucune alerte stock - Tous les produits sont bien approvisionnés</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          Alertes Stock ({alerts.length})
        </h2>
      </div>
      <div className="divide-y">
        {alerts.map((alert, index) => (
          <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-red-50">
            <div>
              <p className="font-medium text-gray-800">{alert.product?.nom || 'Produit'}</p>
              <p className="text-sm text-gray-500">
                Stock actuel: {alert.quantity} | Seuil min: {alert.seuilMin}
              </p>
            </div>
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              {Math.round((alert.quantity / alert.seuilMin) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockAlertList;