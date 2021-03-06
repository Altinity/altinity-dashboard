package server

import "net/http"

type Handler struct {
	authToken   string
	isHTTPS     bool
	origHandler http.Handler
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	tokReq := q.Get("token")
	if tokReq != "" {
		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    tokReq,
			Secure:   h.isHTTPS,
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		})
		u := r.URL
		q.Del("token")
		u.RawQuery = q.Encode()
		http.Redirect(w, r, u.String(), http.StatusFound)
		return
	}
	c, err := r.Cookie("token")
	if err != nil || c.Value != h.authToken {
		w.WriteHeader(401)
		_, _ = w.Write([]byte("Unauthorized"))
		return
	}
	h.origHandler.ServeHTTP(w, r)
}

func NewHandler(origHandler http.Handler, authToken string, isHTTPS bool) http.Handler {
	return &Handler{
		authToken:   authToken,
		isHTTPS:     isHTTPS,
		origHandler: origHandler,
	}
}
