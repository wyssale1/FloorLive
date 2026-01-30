<?php
// sync_games.php
// Holt ALLE Spiele aus der SwissUnihockey API v2 für mehrere Ligen
// und schreibt sie in bet_games

const SU_API_ENDPOINT = 'https://api-v2.swissunihockey.ch/api/games';
const SU_SEASON       = 2025;              // Saison
const SU_GROUP        = 'Gruppe 1';        // für diese Ligen
const SU_TIMEZONE     = 'Europe/Zurich';

/**
 * Diese Ligen / Spielklassen werden synchronisiert.
 * Falls du später mehr willst: einfach ergänzen.
 */
const SU_COMPETITIONS = [
    // key => [league, game_class]
    'lupl_men'   => ['league' => 24, 'game_class' => 11],
    'lupl_women' => ['league' => 24, 'game_class' => 21],
    'nlb_men'    => ['league' => 2,  'game_class' => 11],
    'nlb_women'  => ['league' => 2,  'game_class' => 21],
];

/**
 * Hauptfunktion: holt alle Spiele für ALLE oben definierten Ligen
 * und schreibt sie in bet_games.
 */
function syncSwissUnihockeyGames()
{
    global $pdo;

    $allGamesById = [];

    // Über alle Ligen / Spielklassen iterieren
    foreach (SU_COMPETITIONS as $compKey => $cfg) {
        $leagueId    = (int)$cfg['league'];
        $gameClassId = (int)$cfg['game_class'];

        $games = su_fetchAllSwissUnihockeyGames(SU_SEASON, $leagueId, $gameClassId, SU_GROUP);
        foreach ($games as $g) {
            // KEY = su_game_id (ein Spiel ist eindeutig)
            $allGamesById[$g['su_game_id']] = $g;
        }
    }

    if (empty($allGamesById)) {
        return;
    }

    // INSERT / UPDATE in bet_games
    $sql = "INSERT INTO bet_games (
                su_game_id,
                su_league_id,
                su_game_class_id,
                home_team,
                away_team,
                home_logo_url,
                away_logo_url,
                game_date,
                home_score,
                away_score,
                status
            ) VALUES (
                :su_game_id,
                :su_league_id,
                :su_game_class_id,
                :home_team,
                :away_team,
                :home_logo_url,
                :away_logo_url,
                :game_date,
                :home_score,
                :away_score,
                :status
            )
            ON DUPLICATE KEY UPDATE
                su_league_id     = VALUES(su_league_id),
                su_game_class_id = VALUES(su_game_class_id),
                home_team        = VALUES(home_team),
                away_team        = VALUES(away_team),
                home_logo_url    = VALUES(home_logo_url),
                away_logo_url    = VALUES(away_logo_url),
                game_date        = VALUES(game_date),
                home_score       = VALUES(home_score),
                away_score       = VALUES(away_score),
                status           = VALUES(status)";

    $stmt = $pdo->prepare($sql);

    foreach ($allGamesById as $g) {
        $status = ($g['home_score'] === null || $g['away_score'] === null) ? 'planned' : 'played';

        $stmt->execute([
            ':su_game_id'        => $g['su_game_id'],
            ':su_league_id'      => $g['su_league_id'],
            ':su_game_class_id'  => $g['su_game_class_id'],
            ':home_team'         => $g['home_team'],
            ':away_team'         => $g['away_team'],
            ':home_logo_url'     => $g['home_logo_url'],
            ':away_logo_url'     => $g['away_logo_url'],
            ':game_date'         => $g['game_date'],
            ':home_score'        => $g['home_score'],
            ':away_score'        => $g['away_score'],
            ':status'            => $status,
        ]);
    }
}

/**
 * Holt ALLE Spiele für eine Saison/Liga/Spielklasse (über alle Runden).
 */
function su_fetchAllSwissUnihockeyGames(
    int $season,
    int $leagueId,
    int $gameClassId,
    ?string $group = null
): array {
    $allGamesById = [];

    $result = su_fetchSwissUnihockeyGamesForRound(null, $season, $leagueId, $gameClassId, $group);
    if ($result === null) {
        return [];
    }

    foreach ($result['games'] as $g) {
        $allGamesById[$g['su_game_id']] = $g;
    }

    $prevRound = $result['prev_round'];
    while ($prevRound !== null) {
        $res = su_fetchSwissUnihockeyGamesForRound($prevRound, $season, $leagueId, $gameClassId, $group);
        if ($res === null) break;
        foreach ($res['games'] as $g) {
            $allGamesById[$g['su_game_id']] = $g;
        }
        $prevRound = $res['prev_round'];
    }

    $nextRound = $result['next_round'];
    while ($nextRound !== null) {
        $res = su_fetchSwissUnihockeyGamesForRound($nextRound, $season, $leagueId, $gameClassId, $group);
        if ($res === null) break;
        foreach ($res['games'] as $g) {
            $allGamesById[$g['su_game_id']] = $g;
        }
        $nextRound = $res['next_round'];
    }

    return array_values($allGamesById);
}

/**
 * Holt EINEN Spieltag (Round) für bestimmte Liga/Spielklasse.
 */
function su_fetchSwissUnihockeyGamesForRound(
    ?string $roundId,
    int $season,
    int $leagueId,
    int $gameClassId,
    ?string $group = null
): ?array {
    $params = [
        'mode'       => 'list',
        'season'     => $season,
        'league'     => $leagueId,
        'game_class' => $gameClassId,
        'view'       => 'full',
        'locale'     => 'de_CH',
    ];

    if ($group !== null) {
        $params['group'] = $group;
    }

    if ($roundId !== null) {
        $params['round'] = $roundId;
    }

    $url = SU_API_ENDPOINT . '?' . http_build_query($params);

    $context = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'timeout' => 10,
            'header'  => "Accept: application/json\r\n" .
                         "User-Agent: Unihockey-Tippspiel/1.0\r\n",
        ],
    ]);

    $json = @file_get_contents($url, false, $context);
    if ($json === false) {
        return null;
    }

    $data = json_decode($json, true);
    if (!is_array($data) || !isset($data['data']['regions'])) {
        return null;
    }

    $games = [];

    foreach ($data['data']['regions'] as $region) {
        if (empty($region['rows']) || !is_array($region['rows'])) continue;
        foreach ($region['rows'] as $row) {
            $game = su_parseGameRow($row, $leagueId, $gameClassId);
            if ($game !== null) $games[] = $game;
        }
    }

    $prevRound = null;
    $nextRound = null;

    if (isset($data['data']['slider']['prev']['set_in_context']['round'])) {
        $prevRound = (string)$data['data']['slider']['prev']['set_in_context']['round'];
    }
    if (isset($data['data']['slider']['next']['set_in_context']['round'])) {
        $nextRound = (string)$data['data']['slider']['next']['set_in_context']['round'];
    }

    return [
        'games'      => $games,
        'prev_round' => $prevRound,
        'next_round' => $nextRound,
    ];
}

/**
 * Einzelnes Spiel aus einer Tabellen-Zeile parsen.
 */
function su_parseGameRow(array $row, int $leagueId, int $gameClassId): ?array
{
    if (!isset($row['cells']) || !is_array($row['cells'])) {
        return null;
    }

    $cells = $row['cells'];

    // Struktur wie im JSON, das du geschickt hast:
    // 0: "15.11.2025 17:00"
    // 2: Heimteam (Text)
    // 3: Heim-Logo (image)
    // 5: Auswärts-Logo (image)
    // 6: Auswärtsteam (Text)
    // 7: Resultat
    $dateTimeText = su_getCellText($cells, 0);
    $homeTeam     = su_getCellText($cells, 2);
    $awayTeam     = su_getCellText($cells, 6);
    $scoreText    = su_getCellText($cells, 7);

    $homeLogoUrl  = su_getCellImageUrl($cells, 3);
    $awayLogoUrl  = su_getCellImageUrl($cells, 5);

    if ($homeTeam === '' || $awayTeam === '' || $dateTimeText === '') {
        return null;
    }

    $gameDateTime = su_parseDatetimeFromCell($dateTimeText);
    [$homeScore, $awayScore] = su_parseScore($scoreText);

    // Spiel-ID aus Link holen
    $suGameId = null;
    if (isset($cells[0]['link']['page']) &&
        $cells[0]['link']['page'] === 'game_detail' &&
        isset($cells[0]['link']['ids'][0])) {
        $suGameId = (string)$cells[0]['link']['ids'][0];
    } elseif (isset($row['id'])) {
        $suGameId = (string)$row['id'];
    }

    if ($suGameId === null) {
        return null;
    }

    return [
        'su_game_id'        => $suGameId,
        'su_league_id'      => $leagueId,
        'su_game_class_id'  => $gameClassId,
        'home_team'         => $homeTeam,
        'away_team'         => $awayTeam,
        'home_logo_url'     => $homeLogoUrl,
        'away_logo_url'     => $awayLogoUrl,
        'game_date'         => $gameDateTime,
        'home_score'        => $homeScore,
        'away_score'        => $awayScore,
    ];
}

function su_getCellText(array $cells, int $index): string
{
    if (!isset($cells[$index])) return '';
    $cell = $cells[$index];

    if (isset($cell['text']) && is_array($cell['text']) && !empty($cell['text'])) {
        return trim((string)$cell['text'][0]);
    }
    if (isset($cell['text']) && is_string($cell['text'])) {
        return trim($cell['text']);
    }
    return '';
}

/**
 * Logo-URL aus einer Zelle holen (image.url) und hochskalierte Version verwenden.
 */
function su_getCellImageUrl(array $cells, int $index): ?string
{
    if (!isset($cells[$index])) {
        return null;
    }

    $cell = $cells[$index];

    if (isset($cell['image']['url']) && is_string($cell['image']['url'])) {
        $url = $cell['image']['url'];

        // Cloudinary: kleine Version "t_club_logo_small" entfernen,
        // damit die Originalgröße geladen wird.
        $url = str_replace('/t_club_logo_small/', '/', $url);

        return $url;
    }

    return null;
}

function su_parseDatetimeFromCell(string $dateTimeText): string
{
    $dateTimeText = trim($dateTimeText);
    $tz = new DateTimeZone(SU_TIMEZONE);

    if ($dateTimeText === '') {
        $fallback = new DateTime('1970-01-01 00:00:00', $tz);
        return $fallback->format('Y-m-d H:i:s');
    }

    // Format aus deinem JSON: "15.11.2025 17:00"
    if (preg_match('/(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2})/', $dateTimeText, $m)) {
        $datePart = $m[1];
        $timePart = $m[2];

        $dt = DateTime::createFromFormat('d.m.Y H:i', $datePart . ' ' . $timePart, $tz);
        if ($dt !== false) {
            return $dt->format('Y-m-d H:i:s');
        }
    }

    $normalized = str_replace('.', '-', $dateTimeText);
    $timestamp  = strtotime($normalized);
    if ($timestamp !== false) {
        $dt = new DateTime('@' . $timestamp);
        $dt->setTimezone($tz);
        return $dt->format('Y-m-d H:i:s');
    }

    $fallback = new DateTime('1970-01-01 00:00:00', $tz);
    return $fallback->format('Y-m-d H:i:s');
}

function su_parseScore(string $scoreText): array
{
    $scoreText = trim($scoreText);
    if ($scoreText === '') return [null, null];

    $scoreText = rtrim($scoreText, "* ");
    if (!preg_match('/^(\d+):(\d+)$/', $scoreText, $m)) {
        return [null, null];
    }

    return [(int)$m[1], (int)$m[2]];
}