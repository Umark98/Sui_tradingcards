"use client";

import { useState, useEffect } from 'react';
import CollectionUsersList from '@/components/admin/CollectionUsersList';

export default function MissionsUsersPage() {
  const [missionCardTypes, setMissionCardTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load mission card types
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load database types first
        const debugResponse = await fetch('/api/admin/debug-mission-types');
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          
          // Use actual types from database if available
          if (debugData.allMissionCollectionTypes && debugData.allMissionCollectionTypes.length > 0) {
            const actualTypes = debugData.allMissionCollectionTypes.map((type: any) => type.type_name);
            setMissionCardTypes(actualTypes);
          } else {
            // Fallback to JSON or hardcoded types
            const missionResponse = await fetch('/mission-card-types.json');
            if (missionResponse.ok) {
              const missionData = await missionResponse.json();
              setMissionCardTypes(missionData.missionCardTypes || []);
            } else {
              // Fallback to hardcoded types if file doesn't exist
              setMissionCardTypes([
                'MissionParisRare', 'MissionParisEpic', 'MissionParisLegendary',
                'MissionDublinSuperLegendary', 'MissionDublinLegendary', 'MissionDublinEpic',
                'MissionNewYorkCityUltraCommon', 'MissionNewYorkCityLegendary', 'MissionNewYorkCityEpic',
                'MissionSydneyUltraCommon', 'MissionSydneyRare', 'MissionSydneyEpic',
                'MissionSanDiegoUltraCommon', 'MissionSanDiegoRare', 'MissionSanDiegoEpic',
                'MissionSingaporeUltraCommon', 'MissionTransylvaniaUltraCommon'
              ]);
            }
          }
        } else {
          // If debug API fails, try JSON fallback
          const missionResponse = await fetch('/mission-card-types.json');
          if (missionResponse.ok) {
            const missionData = await missionResponse.json();
            setMissionCardTypes(missionData.missionCardTypes || []);
          } else {
            // Final fallback to hardcoded types
            setMissionCardTypes([
              'MissionParisRare', 'MissionParisEpic', 'MissionParisLegendary',
              'MissionDublinSuperLegendary', 'MissionDublinLegendary', 'MissionDublinEpic',
              'MissionNewYorkCityUltraCommon', 'MissionNewYorkCityLegendary', 'MissionNewYorkCityEpic',
              'MissionSydneyUltraCommon', 'MissionSydneyRare', 'MissionSydneyEpic',
              'MissionSanDiegoUltraCommon', 'MissionSanDiegoRare', 'MissionSanDiegoEpic',
              'MissionSingaporeUltraCommon', 'MissionTransylvaniaUltraCommon'
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Set fallback types even if everything fails
        setMissionCardTypes(['Collector\'s Edition']); // Known type from your database
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-300">Loading mission card types...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mission Cards Collection Users</h1>
          <p className="mt-2 text-gray-300">
            Users who own mission cards from the Missions collection. Currently showing users with the actual mission card types found in your database.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Mission Card NFT Owners</h2>
            <p className="text-sm text-gray-300 mt-1">
              Browse through users who own mission cards. These users own NFTs with the mission card types found in your database.
            </p>
          </div>
          <div className="p-6">
            {missionCardTypes.length > 0 ? (
              <CollectionUsersList 
                collectionName="Missions"
                pageTitle="Mission Cards Collection Users"
                pageDescription="Users who own mission card NFTs"
                missionCardTypes={missionCardTypes}
                hideLevelOnly={true}
              />
            ) : (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">No Mission Card Types Found</h3>
                  <p className="text-white mb-4">
                    No mission card types were found in the Missions collection in your database.
                  </p>
                  <p className="text-red-200 text-sm">
                    This could mean:
                  </p>
                  <ul className="text-red-200 text-sm mt-2 text-left max-w-md mx-auto">
                    <li>• The mission cards haven't been minted yet</li>
                    <li>• The type names in the database don't match the contract</li>
                    <li>• The mission cards are stored under a different collection name</li>
                  </ul>
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-2">Mission Card Types</h3>
            <div className="text-green-100 space-y-2">
              <p>• <strong>{missionCardTypes.length} Mission Types</strong> available</p>
              <p>• <strong>City-Based</strong> mission themes</p>
              <p>• <strong>Multiple Rarities</strong> per city</p>
              <p>• <strong>Genesis Contract</strong> integration</p>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Mission Cities</h3>
            <div className="text-blue-100 space-y-2">
              <p>• <strong>Paris</strong> missions</p>
              <p>• <strong>Dublin</strong> missions</p>
              <p>• <strong>New York City</strong> missions</p>
              <p>• <strong>Sydney & San Diego</strong> missions</p>
              <p>• <strong>Singapore & Transylvania</strong> missions</p>
            </div>
          </div>

          <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-200 mb-2">Mission Rarities</h3>
            <div className="text-purple-100 space-y-2">
              <p>• <strong>UltraCommon</strong> & UltraCommonSigned</p>
              <p>• <strong>Rare</strong> mission cards</p>
              <p>• <strong>Epic</strong> mission cards</p>
              <p>• <strong>Legendary</strong> mission cards</p>
              <p>• <strong>SuperLegendary</strong> (Dublin only)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
