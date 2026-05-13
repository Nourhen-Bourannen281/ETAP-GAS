import React from 'react';

const getStatusColor = (status) => {
  const colors = {
    'Attente': 'bg-gray-100 text-gray-700',
    'En attente de paiement': 'bg-yellow-100 text-yellow-700',
    'En attente de validation': 'bg-blue-100 text-blue-700',
    'Validée': 'bg-green-100 text-green-700',
    'Livrée': 'bg-purple-100 text-purple-700',
    'Payée': 'bg-emerald-100 text-emerald-700'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const RecentOrdersTable = ({ orders }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">📋 Commandes récentes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.numeroCommande}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {order.client?.nom} {order.client?.prenom || ''}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{order.montantTotal?.toLocaleString()} TND</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.statut)}`}>
                    {order.statut}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(order.dateCreation).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrdersTable;