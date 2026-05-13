import React from 'react';

const getActionIcon = (action) => {
  if (action?.includes('création') || action?.includes('ajout')) return '➕';
  if (action?.includes('modification') || action?.includes('mise à jour')) return '✏️';
  if (action?.includes('suppression')) return '🗑️';
  if (action?.includes('validation')) return '✅';
  return '📝';
};

const ActivityLog = ({ activities }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">🔄 Activités récentes</h2>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Aucune activité récente
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((activity, index) => (
              <div key={index} className="px-6 py-3 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="text-xl mr-3">{getActionIcon(activity.action)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">
                        {activity.utilisateur?.nom} {activity.utilisateur?.prenom || ''}
                      </span>
                      {' '}{activity.action}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.dateCreation).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;