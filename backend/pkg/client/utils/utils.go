package utils

import (
	"compress/gzip"
	"fmt"
	"github.com/smwbalfe/shrillecho-playlist-archive/backend/pkg/client/shared"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

var Headers = map[string]string{
	"User-Agent":                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
	"Accept-Encoding":           "gzip, deflate, br",
	"Accept-Language":           "en-GB,en;q=0.5",
	"Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
	"Origin":                    "https://open.spotify.com",
	"Sec-Fetch-Dest":            "document",
	"Sec-Fetch-Mode":            "navigate",
	"Sec-Fetch-Site":            "none",
	"Sec-Fetch-User":            "?1",
	"Upgrade-Insecure-Requests": "1",
	"Te":                        "trailers",
	"Alt-Used":                  "open.spotify.com",
	"Host":                      "open.spotify.com",
	"Connection":                "keep-alive",
}

func AddCookies(req *http.Request) {
	cookies := []http.Cookie{
		{
			Name:  "sp_dc",
			Value: os.Getenv("SP_DC"),
		},
		{
			Name:  "sp_key",
			Value: os.Getenv("SP_KEY"),
		},
	}

	for _, cookie := range cookies {
		req.AddCookie(&cookie)
	}
}

func AddHeaders(req *http.Request) {
	for key, value := range Headers {
		req.Header.Set(key, value)
	}
}

func PerformRequest(req *http.Request, client *http.Client) (shared.RequestResponse, error) {
	resp, err := client.Do(req)
	if err != nil {
		return shared.RequestResponse{}, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()
	var reader io.Reader = resp.Body

	if resp.Header.Get("Content-Encoding") == "gzip" {
		gzReader, err := gzip.NewReader(resp.Body)
		if err != nil {
			return shared.RequestResponse{}, fmt.Errorf("error creating gzip reader: %w", err)
		}
		defer gzReader.Close()
		reader = gzReader
	}

	body, err := io.ReadAll(reader)

	if err != nil {
		return shared.RequestResponse{}, fmt.Errorf("error reading response: %w", err)
	}

	return shared.RequestResponse{
		StatusCode: resp.StatusCode,
		Data:       body,
	}, nil
}

func ExtractID(id string) (string, error) {
	splitString := strings.Split(id, ":")
	if len(splitString) > 2 {
		return splitString[2], nil
	}
	return "", fmt.Errorf("invalid ID format: %s - expected at least 3 parts separated by ':'", id)
}

func ResetVPN() (int, error) {
	time.Sleep(5 * time.Second)
	cmd := exec.Command("nordvpn", "-c")
	if err := cmd.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			if exitErr.ExitCode() == 2 {
				return 2, nil
			} else {
				return exitErr.ExitCode(), err
			}
		}
		return -1, err
	}
	time.Sleep(10 * time.Second)
	return 0, nil
}
