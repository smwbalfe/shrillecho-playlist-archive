package utils

import (
	"net/url"
	"strings"
)

func ExtractSpotifyID(input string) (string, error) {
	if !strings.Contains(input, "/") && !strings.Contains(input, "://") {
		return strings.Split(input, "?")[0], nil
	}
	parsedURL, err := url.Parse(input)
	if err != nil {
		return "", err
	}
	segments := strings.Split(parsedURL.Path, "/")
	var id string
	for i := len(segments) - 1; i >= 0; i-- {
		if segments[i] != "" {
			id = segments[i]
			break
		}
	}
	return strings.Split(id, "?")[0], nil
}

func ExtractSpotifyIDColon(uri string) string {
	parts := strings.Split(uri, ":")
	if len(parts) == 3 {
		return parts[2]
	}
	return ""
}
