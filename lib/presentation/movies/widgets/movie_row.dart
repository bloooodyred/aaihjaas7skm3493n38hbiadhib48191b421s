import 'package:fast_cached_network_image/fast_cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:purevideo/data/models/movie_model.dart';
import 'package:purevideo/data/repositories/filmweb/filmweb_info_repository.dart';

class MovieRow extends StatefulWidget {
  final String title;
  final List<MovieModel> movies;

  const MovieRow({super.key, required this.title, required this.movies});

  @override
  State<MovieRow> createState() => _MovieRowState();
}

class _MovieRowState extends State<MovieRow> {
  late final ScrollController _controller;
  final FilmwebInfoRepository _filmweb = FilmwebInfoRepository();
  int? _hoveredIndex;
  final Map<int, String> _ratings = {};
  final Set<int> _loading = {};

  static const double _rowHeight = 220;
  static const double _aspectRatio = 11 / 16; 
  static const double _spacing = 16;
  static const double _leftPeek = 24; 

  double get _cardWidth => _rowHeight * _aspectRatio;
  double get _step => _cardWidth + _spacing;

  Future<void> _ensureRating(int index, MovieModel movie) async {
    if (kIsWeb) {
      // Na Web nie pobieramy bezpośrednio (CORS).
      return;
    }
    if (_ratings.containsKey(index) || _loading.contains(index)) return;
    _loading.add(index);
    setState(() {});
    try {
      final results = await _filmweb.searchMovie(movie.title, false);
      if (results.isNotEmpty) {
        final rating = await _filmweb.getRating(results.first.id);
        _ratings[index] = rating.rate;
      } else {
        _ratings[index] = '-';
      }
    } catch (_) {
      _ratings[index] = '-';
    } finally {
      _loading.remove(index);
      if (mounted) setState(() {});
    }
  }

  @override
  void initState() {
    super.initState();
    _controller = ScrollController(initialScrollOffset: _leftPeek);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _scrollBy(double delta) async {
    if (!_controller.hasClients) return;
    final current = _controller.offset;
    final double target = (current + delta).clamp(
      _controller.position.minScrollExtent,
      _controller.position.maxScrollExtent,
    ).toDouble();
    if (target == current) return;
    await _controller.animateTo(
      target,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
          child: Text(
            widget.title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
          ),
        ),
        SizedBox(
          height: _rowHeight,
          child: Stack(
            children: [
              ListView.separated(
                controller: _controller,
                padding: EdgeInsets.only(left: 0, right: _spacing),
                scrollDirection: Axis.horizontal,
                itemCount: widget.movies.length,
                separatorBuilder: (context, index) => SizedBox(width: _spacing),
                itemBuilder: (context, index) {
                  final movie = widget.movies[index];
                  final hovered = _hoveredIndex == index;
                  return MouseRegion(
                    opaque: false,
                    onEnter: (_) {
                      _hoveredIndex = index;
                      _ensureRating(index, movie);
                      setState(() {});
                    },
                    onExit: (_) {
                      if (_hoveredIndex == index) {
                        _hoveredIndex = null;
                        setState(() {});
                      }
                    },
                    child: AspectRatio(
                      aspectRatio: _aspectRatio,
                      child: GestureDetector(
                        onTap: () => context.pushNamed(
                          'movie_details',
                          pathParameters: {
                            'title': movie.title,
                          },
                          extra: movie,
                        ),
                        child: Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: FastCachedImage(
                                url: movie.imageUrl,
                                headers: movie.imageHeaders,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => Container(
                                  color: Colors.grey[300],
                                  child: const Icon(
                                    Icons.broken_image,
                                    size: 50,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                            ),
                            if (hovered && (_loading.contains(index) || _ratings.containsKey(index)))
                              Positioned(
                                right: 6,
                                top: 6,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.star,
                                        size: 12,
                                        color: Theme.of(context).colorScheme.primary,
                                      ),
                                      const SizedBox(width: 4),
                                      _loading.contains(index)
                                          ? SizedBox(
                                              width: 10,
                                              height: 10,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                valueColor: AlwaysStoppedAnimation<Color>(
                                                  Theme.of(context).colorScheme.onSurface,
                                                ),
                                              ),
                                            )
                                          : (_ratings[index] != null && _ratings[index] != '-')
                                              ? Text(
                                                  _ratings[index]!,
                                                  style: TextStyle(
                                                    color: Theme.of(context).colorScheme.onSurface,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                )
                                              : const SizedBox.shrink(),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(left: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface.withOpacity(0.6),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.chevron_left),
                      color: Theme.of(context).colorScheme.onSurface,
                      onPressed: () => _scrollBy(_step),
                      tooltip: 'Prev',
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 0,
                top: 0,
                bottom: 0,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.only(right: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface.withOpacity(0.6),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.chevron_right),
                      color: Theme.of(context).colorScheme.onSurface,
                      onPressed: () => _scrollBy(-_step),
                      tooltip: 'Next',
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
