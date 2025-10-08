<?php

namespace App;

use Google\Client;
use Google\Service\Sheets;
use Google\Service\Sheets\Spreadsheet;
use Google\Service\Sheets\SpreadsheetProperties;
use Google\Service\Sheets\ValueRange;
use Google\Service\Sheets\BatchUpdateSpreadsheetRequest;
use Google\Service\Sheets\Request;

class GoogleSheetsManager
{
    private ?Sheets $sheetsService = null;
    private ?Client $client = null;

    public function authenticate(): bool
    {
        try {
            $serviceAccountPath = $_ENV['GOOGLE_SERVICE_ACCOUNT_PATH'] ?? 'service-account.json';

            if (!file_exists($serviceAccountPath)) {
                echo "❌ Service account file not found: {$serviceAccountPath}\n";
                return false;
            }

            echo "🔐 Authenticating with service account...\n";

            $this->client = new Client();
            $this->client->setAuthConfig($serviceAccountPath);
            $this->client->addScope(Sheets::SPREADSHEETS);

            $this->sheetsService = new Sheets($this->client);

            echo "✅ Google Sheets authentication successful\n";
            return true;
        } catch (\Exception $e) {
            echo "❌ Google Sheets authentication failed: {$e->getMessage()}\n";
            return false;
        }
    }

    public function createSpreadsheet(string $title): ?string
    {
        try {
            $spreadsheet = new Spreadsheet([
                'properties' => new SpreadsheetProperties([
                    'title' => $title
                ])
            ]);

            $response = $this->sheetsService->spreadsheets->create($spreadsheet);
            $spreadsheetId = $response->getSpreadsheetId();

            echo "📊 Created new spreadsheet: {$title}\n";
            echo "🔗 URL: https://docs.google.com/spreadsheets/d/{$spreadsheetId}\n";

            return $spreadsheetId;
        } catch (\Exception $e) {
            echo "❌ Failed to create spreadsheet: {$e->getMessage()}\n";
            throw $e;
        }
    }

    public function createSheetTab(string $spreadsheetId, string $sheetName): void
    {
        try {
            $spreadsheet = $this->sheetsService->spreadsheets->get($spreadsheetId);
            $sheets = $spreadsheet->getSheets();

            $sheetExists = false;
            foreach ($sheets as $sheet) {
                if ($sheet->getProperties()->getTitle() === $sheetName) {
                    $sheetExists = true;
                    break;
                }
            }

            if (!$sheetExists) {
                $requests = [
                    new Request([
                        'addSheet' => [
                            'properties' => [
                                'title' => $sheetName
                            ]
                        ]
                    ])
                ];

                $batchUpdateRequest = new BatchUpdateSpreadsheetRequest([
                    'requests' => $requests
                ]);

                $this->sheetsService->spreadsheets->batchUpdate($spreadsheetId, $batchUpdateRequest);
                echo "📄 Created new sheet tab: {$sheetName}\n";
            }
        } catch (\Exception $e) {
            echo "❌ Failed to create sheet tab: {$e->getMessage()}\n";
        }
    }

    public function getExistingData(string $spreadsheetId, string $sheetName): array
    {
        try {
            $range = "{$sheetName}!A:Z";
            $response = $this->sheetsService->spreadsheets_values->get($spreadsheetId, $range);
            return $response->getValues() ?? [];
        } catch (\Exception $e) {
            return [];
        }
    }

    public function writeToSheet(string $spreadsheetId, string $sheetName, array $headers, array $data): void
    {
        try {
            $this->createSheetTab($spreadsheetId, $sheetName);

            // Clear existing data
            try {
                $range = "{$sheetName}!A:Z";
                $this->sheetsService->spreadsheets_values->clear($spreadsheetId, $range, new \Google\Service\Sheets\ClearValuesRequest());
            } catch (\Exception $e) {
                // Ignore clear errors
            }

            // Prepare data with headers
            $values = array_merge([$headers], $data);

            $body = new ValueRange([
                'values' => $values
            ]);

            $params = [
                'valueInputOption' => 'RAW'
            ];

            $range = "{$sheetName}!A1";
            $this->sheetsService->spreadsheets_values->update($spreadsheetId, $range, $body, $params);

            echo "✅ Successfully wrote " . count($data) . " rows to {$sheetName}\n";
        } catch (\Exception $e) {
            echo "❌ Failed to write to sheet: {$e->getMessage()}\n";
            throw $e;
        }
    }

    public function upsertToSheet(string $spreadsheetId, string $sheetName, array $headers, array $newData, int $playerIdColumnIndex): void
    {
        try {
            $this->createSheetTab($spreadsheetId, $sheetName);

            $existingData = $this->getExistingData($spreadsheetId, $sheetName);

            if (empty($existingData)) {
                echo "📝 No existing data, writing " . count($newData) . " new rows...\n";
                $this->writeToSheet($spreadsheetId, $sheetName, $headers, $newData);
                return;
            }

            // Build map of existing player IDs
            $existingPlayerIds = [];
            $existingHeaders = $existingData[0];
            $existingPlayerIdCol = $playerIdColumnIndex;

            if ($existingPlayerIdCol !== -1) {
                for ($i = 1; $i < count($existingData); $i++) {
                    $playerId = $existingData[$i][$existingPlayerIdCol] ?? null;
                    if ($playerId) {
                        $existingPlayerIds[$playerId] = $i;
                    }
                }
            }

            echo "📊 Found " . count($existingPlayerIds) . " existing players in sheet\n";

            // Merge data
            $mergedData = array_slice($existingData, 1);
            $updatedCount = 0;
            $addedCount = 0;

            foreach ($newData as $newRow) {
                $playerId = $newRow[$playerIdColumnIndex] ?? null;

                if ($playerId && isset($existingPlayerIds[$playerId])) {
                    $rowIndex = $existingPlayerIds[$playerId] - 1;
                    $mergedData[$rowIndex] = $newRow;
                    $updatedCount++;
                } else {
                    $mergedData[] = $newRow;
                    $addedCount++;
                }
            }

            echo "🔄 Updated {$updatedCount} existing players\n";
            echo "➕ Added {$addedCount} new players\n";

            $this->writeToSheet($spreadsheetId, $sheetName, $headers, $mergedData);
        } catch (\Exception $e) {
            echo "❌ Failed to upsert to sheet: {$e->getMessage()}\n";
            throw $e;
        }
    }

    public function formatSheet(string $spreadsheetId, int $sheetId): void
    {
        try {
            $requests = [
                new Request([
                    'repeatCell' => [
                        'range' => [
                            'sheetId' => $sheetId,
                            'startRowIndex' => 0,
                            'endRowIndex' => 1
                        ],
                        'cell' => [
                            'userEnteredFormat' => [
                                'backgroundColor' => [
                                    'red' => 0.2,
                                    'green' => 0.6,
                                    'blue' => 0.9
                                ],
                                'textFormat' => [
                                    'foregroundColor' => [
                                        'red' => 1.0,
                                        'green' => 1.0,
                                        'blue' => 1.0
                                    ],
                                    'bold' => true
                                ]
                            ]
                        ],
                        'fields' => 'userEnteredFormat(backgroundColor,textFormat)'
                    ]
                ]),
                new Request([
                    'autoResizeDimensions' => [
                        'dimensions' => [
                            'sheetId' => $sheetId,
                            'dimension' => 'COLUMNS',
                            'startIndex' => 0,
                            'endIndex' => 25
                        ]
                    ]
                ])
            ];

            $batchUpdateRequest = new BatchUpdateSpreadsheetRequest([
                'requests' => $requests
            ]);

            $this->sheetsService->spreadsheets->batchUpdate($spreadsheetId, $batchUpdateRequest);
            echo "✅ Sheet formatting applied\n";
        } catch (\Exception $e) {
            echo "❌ Failed to format sheet: {$e->getMessage()}\n";
        }
    }
}
