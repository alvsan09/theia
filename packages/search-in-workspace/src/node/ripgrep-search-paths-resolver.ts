/********************************************************************************
 * Copyright (C) 2021 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { SearchInWorkspaceOptions } from '../common/search-in-workspace-interface';
import * as fs from '@theia/core/shared/fs-extra';
import * as path from 'path';
import { isRelativeToBaseDirectory, pushIfNotIncluded } from './ripgrep-search-in-workspace-helper';

/**
 * The default search paths are set to be the root paths associated to a workspace
 * however the search scope can be further refined with the include paths available in the search options.
 * This method will replace the searching paths to the ones specified in the 'include' options but as long
 * as the 'include' paths can be successfully validated as existing.
 *
 * Therefore the returned array of paths can be either the workspace root paths or a set of validated paths
 * derived from the include options which can be used to perform the search.
 *
 * Any pattern that resulted in a valid search path will be removed from the 'include' list as it is
 * provided as an equivalent search path instead.
 */
export function resolveSearchPathsFromIncludes(rootPaths: string[], opts: SearchInWorkspaceOptions | undefined): string[] {
    if (!opts || !opts.include) {
        return rootPaths;
    }

    const includesAsPaths = resolvePatternToPathsMap(opts.include, rootPaths);
    const patternPaths = Array.from(includesAsPaths.keys());

    // Remove file patterns that were successfully translated to search paths.
    opts.include = opts.include.filter(item => !patternPaths.includes(item));

    return includesAsPaths.size > 0 ? [].concat.apply([], Array.from(includesAsPaths.values())) : rootPaths;
}

/**
 * Attempts to resolve valid file paths from a given list of patterns.
 * The given search paths are used to try resolving relative path patterns to an absolute path.
 * The resulting map will include all patterns associated to its equivalent file paths.
 * The given patterns that are not successfully mapped to paths are not included.
 */
function resolvePatternToPathsMap(patterns: string[], searchPaths: string[]): Map<string, string[]> {
    const patternToPathMap = new Map<string, string[]>();

    patterns.forEach(pattern => {
        searchPaths.forEach(root => {
            const foundPath = resolveIncludeFolderFromGlob(root, pattern);

            if (foundPath) {
                const pathArray = patternToPathMap.get(pattern);
                patternToPathMap.set(pattern, pushIfNotIncluded(pathArray, foundPath));
            }
        });
    });

    return patternToPathMap;
}

/**
 * Attempts to build a valid absolute file or directory from the given pattern and root folder.
 * e.g. /a/b/c/foo/** to /a/b/c/foo, or './foo/**' to '${root}/foo'.
 *
 * @returns the valid path if found existing in the file system.
 */
function resolveIncludeFolderFromGlob(root: string, pattern: string): string | undefined {
    const patternBase = stripGlobSuffix(pattern);

    if (!path.isAbsolute(patternBase) && !isRelativeToBaseDirectory(patternBase)) {
        // The include pattern is not referring to a single file / folder, i.e. not to be converted
        // to include folder.
        return undefined;
    }

    const targetPath = path.isAbsolute(patternBase) ? patternBase : path.join(root, patternBase);

    if (fs.existsSync(targetPath)) {
        return targetPath;
    }

    return undefined;
}

/**
 * Removes a glob suffix from a given pattern (e.g. /a/b/c/**)
 * to a directory path (/a/b/c).
 *
 * @returns the path without the glob suffix,
 * else returns the original pattern.
 */
function stripGlobSuffix(pattern: string): string {
    const pathParsed = path.parse(pattern);
    const suffix = pathParsed.base;

    return suffix === '**' ? pathParsed.dir : pattern;
}
