<?php

require_once __DIR__ . '/vendor/autoload.php';

use Symfony\Component\Panther\Client;
use App\GoogleSheetsManager;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

function scrapeAllWithDetails(): void
{
    $client = Client::createChromeClient(null, [
        '--headless',
        '--no-sandbox',
        '--disable-setuid-sandbox'
    ]);

    $sheetsManager = new GoogleSheetsManager();

    try {
        echo "🚀 Starting complete player data scraping (list + details)...\n";

        // Authenticate with Google Sheets
        if (!$sheetsManager->authenticate()) {
            throw new Exception("Google Sheets authentication failed");
        }

        // Login to PManager
        $crawler = $client->request('GET', 'https://www.pmanager.org/default.asp');
        
        $username = $_ENV['TEST_USERNAME'] ?? null;
        $password = $_ENV['TEST_PASSWORD'] ?? null;

        if (!$username || !$password) {
            throw new Exception("Please set TEST_USERNAME and TEST_PASSWORD in .env file");
        }

        echo "🔐 Logging in to PManager...\n";
        
        $form = $crawler->filter('#loginForm')->form([
            'utilizador' => $username,
            'password' => $password
        ]);
        
        $client->submit($form);
        $client->waitFor('body');

        if (str_contains($client->getCurrentURL(), 'erro=logout')) {
            throw new Exception("Login failed - invalid credentials");
        }

        echo "✅ Login successful\n\n";

        // ========== PHASE 1: Scrape player list from all pages ==========
        echo "📋 PHASE 1: Scraping player list from all pages...\n";

        $baseSearchUrl = "/procurar.asp?action=proc_jog&nome=&pos=0&nacional=-1&lado=-1&idd_op=%3C&idd=Any&temp_op=%3C&temp=Any&expe_op=%3E=&expe=Any&con_op=%3C&con=Any&pro_op=%3E&pro=Any&vel_op=%3E&vel=Any&forma_op=%3E&forma=Any&cab_op=%3E&cab=Any&ord_op=%3C=&ord=Any&cul_op=%3E&cul=Any&pre_op=%3C=&pre=Any&forca_op=%3E&forca=Any&lesionado=Any&prog_op=%3E&prog=Any&tack_op=%3E&tack=Any&internacional=Any&passe_op=%3E&passe=Any&pais=-1&rem_op=%3E&rem=Any&tec_op=%3E&tec=Any&jmaos_op=%3E&jmaos=Any&saidas_op=%3E&saidas=Any&reflexos_op=%3E&reflexos=Any&agilidade_op=%3E&agilidade=Any&B1=Pesquisar&field=&sort=0&pv=1&qual_op=%3E&qual=7&talento=Any";

        $crawler = $client->request('GET', "https://www.pmanager.org{$baseSearchUrl}&pid=1");
        $client->waitFor('table');

        // Get total pages
        $totalPages = 1;
        try {
            $crawler->filter('td')->each(function($td) use (&$totalPages) {
                $text = $td->text();
                if (strpos($text, 'Number of pages') !== false) {
                    if (preg_match('/Number of pages:\s*(\d+)/', $text, $matches)) {
                        $totalPages = (int)$matches[1];
                    }
                }
            });
        } catch (Exception $e) {
            // Default to 1 page
        }

        echo "   Found {$totalPages} pages to scrape\n";
        echo "   🧪 TEST MODE: Scraping only 1 page\n";

        $allPlayers = [];
        $excludeColumns = ['Wage', 'Ask. Price', 'Deadline', ''];
        $headers = null;
        $enhancedHeaders = null;
        $columnMapping = null;

        // Scrape all pages (TEST: only 1 page)
        $pagesToScrape = 1; // TEST MODE
        for ($pageNum = 1; $pageNum <= $pagesToScrape; $pageNum++) {
            echo "   📄 Page {$pageNum}/{$totalPages}...\n";

            $crawler = $client->request('GET', "https://www.pmanager.org{$baseSearchUrl}&pid={$pageNum}");
            $client->waitFor('table');

            $tables = $crawler->filter('table');

            foreach ($tables as $tableIndex => $tableNode) {
                $table = $crawler->filter('table')->eq($tableIndex);
                $rows = $table->filter('tr');

                if ($rows->count() > 5) {
                    if ($headers === null) {
                        $headers = $rows->first()->filter('th, td')->each(fn($node) => trim($node->text()));
                        $enhancedHeaders = [];
                        $columnMapping = [];

                        foreach ($headers as $j => $header) {
                            if (in_array($header, $excludeColumns)) continue;
                            $columnMapping[] = $j;
                            $enhancedHeaders[] = $header;
                        }

                        $nameIndex = array_search('Name', $headers);
                        if ($nameIndex !== false && !in_array('Name', $excludeColumns)) {
                            $namePos = array_search('Name', $enhancedHeaders);
                            array_splice($enhancedHeaders, $namePos + 1, 0, ['PlayerID']);
                        }

                        // Add detail columns
                        $enhancedHeaders = array_merge($enhancedHeaders, [
                            'Team', 'Quality', 'Affected Quality', 'Potential', 'Penalties', 'Value', 'Last Updated'
                        ]);
                    }

                    $rows->each(function($row, $i) use (&$allPlayers, $headers, $columnMapping, $excludeColumns) {
                        if ($i === 0) return; // Skip header row

                        $cells = $row->filter('td');
                        if ($cells->count() === 0) return;

                        $rowData = [];
                        $playerId = null;

                        $cells->each(function($cell, $j) use (&$rowData, &$playerId) {
                            $cellText = trim($cell->text());
                            
                            try {
                                $link = $cell->filter('a[href*="ver_jogador.asp?jog_id="]');
                                if ($link->count() > 0) {
                                    $href = $link->attr('href');
                                    if (preg_match('/jog_id=(\d+)/', $href, $matches)) {
                                        $playerId = $matches[1];
                                    }
                                }
                            } catch (Exception $e) {
                                // No link in this cell
                            }

                            $rowData[] = $cellText;
                        });

                        if (!empty($rowData) && $playerId) {
                            $finalRow = [];
                            foreach ($columnMapping as $originalIndex) {
                                $finalRow[] = $rowData[$originalIndex];
                                if ($headers[$originalIndex] === 'Name') {
                                    $finalRow[] = $playerId;
                                }
                            }

                            // Add placeholders for detail columns (will be filled in phase 2)
                            $finalRow = array_merge($finalRow, ['', '', '', '', '', '', date('c')]);

                            $allPlayers[$playerId] = $finalRow;
                        }
                    });

                    break;
                }
            }

            usleep(300000); // 300ms delay
        }

        echo "   ✅ Phase 1 complete: " . count($allPlayers) . " unique players found\n\n";

        // ========== PHASE 2: Get player details ==========
        echo "📋 PHASE 2: Scraping player details...\n";
        echo "   ⏱️  Estimated time: " . ceil((count($allPlayers) * 2) / 60) . " minutes\n\n";

        $playerIds = array_keys($allPlayers);
        $detailColumnIndices = [
            'team' => array_search('Team', $enhancedHeaders),
            'quality' => array_search('Quality', $enhancedHeaders),
            'affected_quality' => array_search('Affected Quality', $enhancedHeaders),
            'potential' => array_search('Potential', $enhancedHeaders),
            'penalties' => array_search('Penalties', $enhancedHeaders),
            'value' => array_search('Value', $enhancedHeaders),
            'last_updated' => array_search('Last Updated', $enhancedHeaders)
        ];

        $successCount = 0;
        $errorCount = 0;

        foreach ($playerIds as $i => $playerId) {
            echo "   📄 Player " . ($i + 1) . "/" . count($playerIds) . " (ID: {$playerId})...\n";

            try {
                // Load player page with #info to get Contract tab data
                $crawler = $client->request('GET', "https://www.pmanager.org/ver_jogador.asp?jog_id={$playerId}#info");
                $client->waitFor('body');
                usleep(500000); // Wait 500ms for content to load

                $playerRow = &$allPlayers[$playerId];

                // Team
                try {
                    $teamLink = $crawler->filter('a[href*="ver_equipa"]')->first();
                    $playerRow[$detailColumnIndices['team']] = $teamLink->count() > 0 ? trim($teamLink->text()) : 'Free Agent';
                } catch (Exception $e) {
                    $playerRow[$detailColumnIndices['team']] = 'Free Agent';
                }

                // Quality
                try {
                    $qualityText = '';
                    $crawler->filter('tr')->each(function($row) use (&$qualityText) {
                        $text = $row->text();
                        if (strpos($text, 'Quality') !== false && strpos($text, 'Affected') === false) {
                            $cells = $row->filter('td');
                            if ($cells->count() >= 2) {
                                $qualityText = trim($cells->eq(1)->text());
                            }
                        }
                    });
                    $playerRow[$detailColumnIndices['quality']] = $qualityText;
                } catch (Exception $e) {
                    $playerRow[$detailColumnIndices['quality']] = '';
                }

                // Affected Quality
                try {
                    $affectedText = '';
                    $crawler->filter('tr')->each(function($row) use (&$affectedText) {
                        $text = $row->text();
                        if (strpos($text, 'Affected Quality') !== false) {
                            $cells = $row->filter('td');
                            if ($cells->count() >= 2) {
                                $affectedText = trim($cells->eq(1)->text());
                            }
                        }
                    });
                    $playerRow[$detailColumnIndices['affected_quality']] = $affectedText;
                } catch (Exception $e) {
                    $playerRow[$detailColumnIndices['affected_quality']] = '';
                }

                // Potential (not "Next Season")
                try {
                    $potentialText = '';
                    $crawler->filter('tr')->each(function($row) use (&$potentialText) {
                        $text = $row->text();
                        if (strpos($text, 'Potential') !== false && strpos($text, 'Next Season') === false) {
                            $cells = $row->filter('td');
                            if ($cells->count() >= 2) {
                                $potentialText = trim($cells->last()->text());
                            }
                        }
                    });
                    $playerRow[$detailColumnIndices['potential']] = $potentialText;
                } catch (Exception $e) {
                    $playerRow[$detailColumnIndices['potential']] = '';
                }

                // Penalties
                try {
                    $penaltiesText = '';
                    $crawler->filter('tr')->each(function($row) use (&$penaltiesText) {
                        $text = $row->text();
                        if (strpos($text, 'Penalties') !== false) {
                            $cells = $row->filter('td');
                            if ($cells->count() >= 2) {
                                $penaltiesText = trim($cells->eq(1)->text());
                            }
                        }
                    });
                    $playerRow[$detailColumnIndices['penalties']] = $penaltiesText;
                } catch (Exception $e) {
                    $playerRow[$detailColumnIndices['penalties']] = '';
                }

                // Value - use JavaScript to extract it reliably
                try {
                    $valueText = $client->executeScript("
                        var rows = document.querySelectorAll('tr');
                        var value = '';
                        for (var i = 0; i < rows.length; i++) {
                            var cells = rows[i].querySelectorAll('td');
                            for (var j = 0; j < cells.length; j++) {
                                var cellText = cells[j].textContent.trim();
                                if (cellText === 'Value') {
                                    if (j + 2 < cells.length) {
                                        value = cells[j + 2].textContent.trim();
                                        break;
                                    }
                                }
                            }
                            if (value) break;
                        }
                        return value;
                    ");
                    
                    // Convert format: "60.017.450 baht" -> "60,017,450"
                    if ($valueText) {
                        // Remove " baht" suffix
                        $valueText = str_replace(' baht', '', $valueText);
                        // Replace dots with commas
                        $valueText = str_replace('.', ',', $valueText);
                    }
                    
                    $playerRow[$detailColumnIndices['value']] = $valueText ?: '';
                } catch (Exception $e) {
                    $playerRow[$detailColumnIndices['value']] = '';
                }

                // Update timestamp
                $playerRow[$detailColumnIndices['last_updated']] = date('c');

                $successCount++;
                echo "      ✅ Success - Team: {$playerRow[$detailColumnIndices['team']]}, Quality: {$playerRow[$detailColumnIndices['quality']]}\n";
            } catch (Exception $error) {
                $errorCount++;
                echo "      ❌ Error: {$error->getMessage()}\n";
            }

            usleep(200000); // 200ms delay
        }

        echo "\n   ✅ Phase 2 complete: {$successCount} success, {$errorCount} errors\n\n";

        // ========== PHASE 3: Upload to Google Sheets ==========
        echo "📤 PHASE 3: Uploading to Google Sheets...\n";

        $spreadsheetTitle = "PManager Players - " . date('Y-m-d');
        $spreadsheetId = $_ENV['GOOGLE_SPREADSHEET_ID'] ?? null;

        if (!$spreadsheetId) {
            $spreadsheetId = $sheetsManager->createSpreadsheet($spreadsheetTitle);
            echo "💡 Add to .env: GOOGLE_SPREADSHEET_ID={$spreadsheetId}\n";
        }

        $sheetName = 'Current_Very_Good_Players';
        $allPlayerRows = array_values($allPlayers);
        $playerIdColumnIndex = array_search('PlayerID', $enhancedHeaders);

        $sheetsManager->upsertToSheet($spreadsheetId, $sheetName, $enhancedHeaders, $allPlayerRows, $playerIdColumnIndex);
        $sheetsManager->formatSheet($spreadsheetId, 0);

        echo "\n🎉 Complete! " . count($allPlayers) . " players with full details uploaded\n";
        echo "🔗 View: https://docs.google.com/spreadsheets/d/{$spreadsheetId}\n";

    } catch (Exception $error) {
        echo "❌ Error: {$error->getMessage()}\n";
    } finally {
        $client->quit();
    }
}

scrapeAllWithDetails();
